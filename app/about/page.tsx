import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans">
      <Nav showBack />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-4">About Truzot</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 font-light leading-relaxed">
          We believe everyone deserves a professional headshot.
        </p>
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
            <h2 className="text-xl font-bold mb-3">Our Mission</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Traditional headshots cost hundreds of dollars. Truzot
              democratizes professional branding using generative AI.
            </p>
          </div>
        </div>
        <div className="text-center mt-12">
          <Link
            href="/upload"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
          >
            Get Your Headshots Now →
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
