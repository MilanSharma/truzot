import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 py-12 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
        <div>
          <div className="text-2xl font-bold text-white mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            TRUZOT
          </div>
          <p className="text-sm">
            AI-powered professional headshots without the studio hassle.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Product</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/upload" className="hover:text-white transition">
                Create Headshots
              </Link>
            </li>
            <li>
              <Link href="/#pricing" className="hover:text-white transition">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white transition">
                My Account
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Company</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/about" className="hover:text-white transition">
                About
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-white transition">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white transition">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/affiliates" className="hover:text-white transition">
                Affiliate Program
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-white transition">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/team" className="hover:text-white transition">
                Team
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/privacy" className="hover:text-white transition">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white transition">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/refund" className="hover:text-white transition">
                Refund Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-slate-800 mt-8 pt-8 text-center text-sm">
        &copy; {new Date().getFullYear()} Truzot. Professional headshots,
        AI-generated.
      </div>
    </footer>
  );
}
