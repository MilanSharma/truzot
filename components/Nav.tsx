import Link from 'next/link';
interface NavProps { showBack?: boolean; }
export default function Nav({ showBack = false }: NavProps) {
  return (
    <nav className="w-full bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">TRUZOT</Link>
        {showBack ? <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">← Back to Home</Link> : (
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/#pricing" className="text-slate-600 hover:text-blue-600 transition">Pricing</Link>
            <Link href="/faq" className="text-slate-600 hover:text-blue-600 transition">FAQ</Link>
            <Link href="/contact" className="text-slate-600 hover:text-blue-600 transition">Contact</Link>
            <Link href="/login" className="text-slate-600 hover:text-blue-600 transition">Sign In</Link>
            <Link href="/upload" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">Get Started</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
