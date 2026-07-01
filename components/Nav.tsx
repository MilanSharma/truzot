"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Menu, X, Sun, Moon, LogOut, User, Settings, LayoutDashboard } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";

interface NavProps {
  showBack?: boolean;
  user?: {
    email?: string;
    id?: string;
    user_metadata?: { full_name?: string; avatar_url?: string };
  } | null;
}

function UserMenu({ user, onLogout }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && buttonRef.current && !buttonRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button ref={buttonRef} onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--surface2)] transition">
        <div className="w-8 h-8 rounded-full bg-[var(--lime-dim)] flex items-center justify-center text-[var(--lime)] font-semibold text-sm">
          {(user.user_metadata?.full_name || user.email || "?").charAt(0).toUpperCase()}
        </div>
        <span className="hidden md:block text-sm font-medium text-[var(--text)] truncate max-w-[140px]">
          {user.user_metadata?.full_name || user.email}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-lg)] py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-sm font-semibold text-[var(--text)] truncate">{user.user_metadata?.full_name || user.email}</p>
          </div>
          <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition"><LayoutDashboard className="w-4 h-4" />Dashboard</Link>
          <Link href="/account" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition"><User className="w-4 h-4" />Account Settings</Link>
          <hr className="my-1.5 border-[var(--border)]" />
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[var(--error)] hover:bg-[var(--error)]/10 transition text-left"><LogOut className="w-4 h-4" />Sign Out</button>
        </div>
      )}
    </div>
  );
}

export default function Nav({ showBack = false, user = null }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (showBack) {
      supabase.auth.getUser().then(({ data }) => { if (data.user) setIsAuthed(true); });
    }
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showBack]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className={`w-full fixed top-0 z-50 transition-all duration-300 ${scrolled ? 'nav-scrolled' : 'nav-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black tracking-tighter logo-text">
          TRUZOT<span className="ml-1.5 text-[10px] font-bold logo-ai align-super tracking-widest">AI</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/#pricing" className="text-[var(--text-muted)] hover:text-[var(--text)] transition">Pricing</Link>
          <Link href="/faq" className="text-[var(--text-muted)] hover:text-[var(--text)] transition">FAQ</Link>
          
          <button onClick={toggle} className="w-9 h-9 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-hover)] flex items-center justify-center transition" aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <UserMenu user={user} onLogout={handleLogout} />
          ) : (
            <Link href="/login" className="text-[var(--text-muted)] hover:text-[var(--text)] transition">Sign In</Link>
          )}
          <Link href="/upload" className="btn-primary">Get headshots</Link>
        </div>
      </div>
    </nav>
  );
}
