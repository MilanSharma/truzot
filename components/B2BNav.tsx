import Link from "next/link";
import { Database, FileText, Mail, Github, Linkedin } from "lucide-react";

export default function B2BNav() {
  const navLinks = [
    { href: "/datasets", label: "Datasets" },
    { href: "/custom-data", label: "Custom Data" },
    { href: "/about", label: "About" },
  ];

  return (
    <nav className="w-full fixed top-0 z-50 bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight text-[var(--text)]">
          TRUZOT
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition"
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/custom-data"
            className="btn-primary text-sm"
          >
            Request Data
          </Link>
        </div>

        {/* Mobile Menu Button - Simplified */}
        <div className="md:hidden">
          <Link
            href="/custom-data"
            className="btn-primary text-sm px-4 py-2"
          >
            Request Data
          </Link>
        </div>
      </div>
    </nav>
  );
}
