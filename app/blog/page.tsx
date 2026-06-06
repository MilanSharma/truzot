import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getAllPosts } from "@/lib/blog";
import { PAGE_SEO, SITE_CONFIG } from "@/lib/seo";

const seo = PAGE_SEO.blog;

export const metadata: Metadata = {
  title: seo.title,
  description: seo.description,
  keywords: seo.keywords,
  authors: [{ name: "Truzot" }],
  creator: "Truzot",
  alternates: { canonical: `${SITE_CONFIG.url}/blog` },
  openGraph: {
    title: seo.ogTitle || seo.title,
    description: seo.ogDescription || seo.description,
    url: `${SITE_CONFIG.url}/blog`,
    siteName: "Truzot",
    images: [{ url: SITE_CONFIG.ogImage, width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seo.ogTitle || seo.title,
    description: seo.ogDescription || seo.description,
    images: [SITE_CONFIG.ogImage],
  },
};

export default function BlogPage() {
  const posts = getAllPosts();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Nav />
      <div id="main-content" className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2 text-slate-900 dark:text-white">
          AI Headshots Blog
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 font-light">
          Expert tips, comprehensive guides, and insights about professional AI
          headshots, LinkedIn optimization, and personal branding.
        </p>
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block group"
            >
              <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
                <div className="text-xs text-blue-600 font-semibold mb-2 uppercase tracking-wider">
                  {post.date} · {post.readTime}
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition">
                  {post.title}
                </h2>
              </article>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
