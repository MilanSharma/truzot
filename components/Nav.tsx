"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  User,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface NavProps {
  showBack?: boolean;
  user?: { email: string; id?: string } | null;
}

function DarkModeToggle() {
  const [isDark, setIsDark] = useState(
    () =>
      typeof window !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="text-slate-600 hover:text-slate-900 transition"
      aria-label="Toggle dark mode"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

function UserMenu({
  user,
  onLogout,
}: {
  user: { email: string; id?: string } | null;
  onLogout: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
          {user.email?.charAt(0).toUpperCase()}
        </div>
        <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
          {user.email}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-4 py-3 border-b border-[var(--border-primary)]">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {user.email}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pro Plan
              </p>
            </div>
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/account"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <User className="w-4 h-4" />
              Account Settings
            </Link>
            <Link
              href="/affiliates"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <Settings className="w-4 h-4" />
              Affiliate Program
            </Link>
            <hr className="my-1.5 border-[var(--border-primary)]" />
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Nav({ showBack = false, user = null }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const navLinks = (
    <>
      <div className="hidden md:flex items-center gap-6 text-sm font-medium">
        <Link
          href="/#pricing"
          className="text-slate-600 dark:text-slate-400 hover:text-blue-600 transition"
        >
          Pricing
        </Link>
        <Link
          href="/faq"
          className="text-slate-600 dark:text-slate-400 hover:text-blue-600 transition"
        >
          FAQ
        </Link>
        <Link
          href="/contact"
          className="text-slate-600 dark:text-slate-400 hover:text-blue-600 transition"
        >
          Contact
        </Link>
        <Link
          href="/affiliates"
          className="text-slate-600 dark:text-slate-400 hover:text-blue-600 transition"
        >
          Affiliates
        </Link>
        <DarkModeToggle />
        {user ? (
          <>
            <UserMenu user={user} onLogout={handleLogout} />
            <Link
              href="/upload"
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
            >
              Get Headshots
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-slate-600 dark:text-slate-400 hover:text-blue-600 transition"
            >
              Sign In
            </Link>
            <Link
              href="/upload"
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
            >
              Get Headshots
            </Link>
          </>
        )}
      </div>
      <div className="flex md:hidden items-center gap-3">
        <DarkModeToggle />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-slate-600 dark:text-slate-400"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </>
  );

  return (
    <nav
      className="w-full bg-[var(--bg-primary)] border-b border-[var(--border-primary)] sticky top-0 z-50"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
        >
          TRUZOT
        </Link>
        {showBack ? (
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
          >
            ← Back to Home
          </Link>
        ) : (
          navLinks
        )}
      </div>
      {mobileOpen && !showBack && (
        <div className="md:hidden bg-[var(--bg-card)] border-b border-[var(--border-primary)] py-4 px-6 flex flex-col gap-4 text-sm font-medium">
          <Link
            href="/#pricing"
            onClick={() => setMobileOpen(false)}
            className="text-slate-600 dark:text-slate-400"
          >
            Pricing
          </Link>
          <Link
            href="/faq"
            onClick={() => setMobileOpen(false)}
            className="text-slate-600 dark:text-slate-400"
          >
            FAQ
          </Link>
          <Link
            href="/contact"
            onClick={() => setMobileOpen(false)}
            className="text-slate-600 dark:text-slate-400"
          >
            Contact
          </Link>
          <Link
            href="/affiliates"
            onClick={() => setMobileOpen(false)}
            className="text-slate-600 dark:text-slate-400"
          >
            Affiliates
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="text-slate-600 dark:text-slate-400"
            >
              {user.email}
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="text-slate-600 dark:text-slate-400"
            >
              Sign In
            </Link>
          )}
          <Link
            href="/upload"
            onClick={() => setMobileOpen(false)}
            className="bg-blue-600 text-white text-center px-4 py-2 rounded-lg font-semibold"
          >
            Get Headshots
          </Link>
        </div>
      )}
    </nav>
  );
}
