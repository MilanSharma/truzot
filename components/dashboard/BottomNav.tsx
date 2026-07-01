"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, Settings } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0E1016] border-t border-white/10 flex items-center justify-around px-6 py-3 z-50 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
      <Link
        href="/dashboard"
        className={`flex flex-col items-center gap-1.5 transition-colors ${
          pathname === '/dashboard'
            ? 'text-lime-400'
            : 'text-white/40 hover:text-white/70'
        }`}
      >
        <LayoutDashboard className="w-6 h-6" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Projects</span>
      </Link>
      
      <Link href="/upload" className="flex flex-col items-center group">
        <div className="w-14 h-14 -mt-8 bg-lime-400 rounded-full flex items-center justify-center text-black border-4 border-[#0E1016] shadow-[0_0_20px_rgba(163,230,53,0.3)] group-hover:scale-105 transition-transform">
          <Plus className="w-7 h-7" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider mt-1.5 text-white">New Shoot</span>
      </Link>
      
      <Link
        href="/account"
        className={`flex flex-col items-center gap-1.5 transition-colors ${
          pathname === '/account'
            ? 'text-lime-400'
            : 'text-white/40 hover:text-white/70'
        }`}
      >
        <Settings className="w-6 h-6" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Account</span>
      </Link>
    </div>
  );
}