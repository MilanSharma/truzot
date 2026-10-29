import Link from "next/link";
import { Github, Linkedin, Mail, Database } from "lucide-react";

export default function B2BFooter() {
  return (
    <footer className="bg-[var(--surface)] border-t border-[var(--border)] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="text-2xl font-bold text-[var(--text)] mb-4">
              TRUZOT
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Premium synthetic training data for Agentic AI workflows.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-[var(--text)] mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/datasets" className="text-[var(--text-muted)] hover:text-[var(--text)] transition">
                  Datasets
                </Link>
              </li>
              <li>
                <Link href="/custom-data" className="text-[var(--text-muted)] hover:text-[var(--text)] transition">
                  Custom Data
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-[var(--text-muted)] hover:text-[var(--text)] transition">
                  Quality Assurance
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-[var(--text)] mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-[var(--text-muted)] hover:text-[var(--text)] transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[var(--text-muted)] hover:text-[var(--text)] transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-semibold text-[var(--text)] mb-4">Connect</h4>
            <div className="flex gap-4">
              <a
                href="https://huggingface.co/datasets/milansharma82/agentic-workflows-sample"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-hover)] flex items-center justify-center transition"
                aria-label="Hugging Face"
              >
                <Database className="w-5 h-5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-hover)] flex items-center justify-center transition"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-hover)] flex items-center justify-center transition"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:milan@truzot.com?subject=Custom%20Agentic%20Dataset%20Inquiry"
                className="w-10 h-10 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-hover)] flex items-center justify-center transition"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[var(--text-muted)]">
          <p>&copy; {new Date().getFullYear()} Truzot Data. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[var(--text)] transition">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[var(--text)] transition">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
