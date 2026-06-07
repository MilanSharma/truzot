"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";

interface NavProps {
  showBack?: boolean;
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

export default function Nav({ showBack = false }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="w-full bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50"
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
              <Link
                href="/login"
                className="text-slate-600 dark:text-slate-400 hover:text-blue-600 transition"
              >
                Sign In
              </Link>
              <Link
                href="/upload"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
              >
                Get Started
              </Link>
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
        )}
      </div>
      {mobileOpen && !showBack && (
        <div className="md:hidden bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 py-4 px-6 flex flex-col gap-4 text-sm font-medium">
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
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="text-slate-600 dark:text-slate-400"
          >
            Sign In
          </Link>
          <Link
            href="/upload"
            onClick={() => setMobileOpen(false)}
            className="bg-blue-600 text-white text-center px-4 py-2 rounded-lg font-semibold"
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
