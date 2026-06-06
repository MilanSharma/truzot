import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getAllPosts } from "@/lib/blog";
import { PAGE_SEO, SITE_CONFIG } from "@/lib/seo";

export const metadata: Metadata = {
  title: PAGE_SEO.blog.title,
  description: PAGE_SEO.blog.description,
  keywords: PAGE_SEO.blog.keywords,
  alternates: { canonical: `${SITE_CONFIG.url}/blog` },
  openGraph: {
    title: PAGE_SEO.blog.title,
    description: PAGE_SEO.blog.description,
    url: `${SITE_CONFIG.url}/blog`,
  },
};

export default function BlogPage() {
  const posts = getAllPosts();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Nav />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2 text-slate-900 dark:text-white">
          The Truzot Blog
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 font-light">
          Tips, tricks, and insights on professional branding and AI technology.
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
