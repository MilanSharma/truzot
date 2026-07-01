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
    <div className="min-h-screen">
      <Nav />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black tracking-tight mb-2 text-[var(--text)]">
          AI Headshots Blog
        </h1>
        <p className="text-lg text-[var(--text-muted)] mb-10 font-light">
          Expert tips, comprehensive guides, and insights about professional AI
          headshots, LinkedIn optimization, and personal branding.
        </p>
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
              <article
                className="border rounded-2xl p-6 transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1"
                
              >
                <div className="text-xs text-lime-400 font-semibold mb-2 uppercase tracking-wider">
                  {post.date} · {post.readTime}
                </div>
                <h2 className="text-xl font-bold text-[var(--text)] mb-2 group-hover:text-lime-400 transition">
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