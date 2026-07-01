import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getPost, getAllPosts } from "@/lib/blog";
import { SITE_CONFIG } from "@/lib/seo";
import { BlogPostingSchema, BreadcrumbSchema } from "@/components/JsonLd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const post = getPost(resolvedParams.slug);
  if (!post) {
    return {
      title: "Post Not Found - Truzot Blog",
      robots: { index: false },
    };
  }
  return {
    title: `${post.title} - Truzot AI Headshots Blog`,
    description:
      post.excerpt ||
      `Read "${post.title}" on the Truzot Blog. Expert insights on AI headshots and professional branding.`,
    keywords: [
      "AI headshots",
      "professional headshots",
      post.title,
      "LinkedIn tips",
      "personal branding",
      "AI photography",
    ],
    authors: [{ name: post.author || "Truzot Team" }],
    creator: post.author || "Truzot",
    alternates: { canonical: `${SITE_CONFIG.url}/blog/${post.slug}` },
    openGraph: {
      title: `${post.title} - Truzot AI Headshots Blog`,
      description: post.excerpt || `Read "${post.title}" on the Truzot Blog.`,
      url: `${SITE_CONFIG.url}/blog/${post.slug}`,
      siteName: "Truzot",
      type: "article",
      publishedTime: post.date,
      authors: [post.author || "Truzot Team"],
      images: post.image
        ? [{ url: post.image, width: 1200, height: 630, alt: post.title }]
        : [
            {
              url: SITE_CONFIG.ogImage,
              width: 1200,
              height: 630,
              alt: "Truzot AI Headshots Blog",
            },
          ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} - Truzot AI Headshots Blog`,
      description: post.excerpt || `Read "${post.title}" on the Truzot Blog.`,
      images: post.image ? [post.image] : [SITE_CONFIG.ogImage],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const post = getPost(resolvedParams.slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen">
      <BlogPostingSchema
        title={post.title}
        description={post.excerpt || post.title}
        datePublished={post.date}
        dateModified={post.date}
        author={post.author || "Truzot Team"}
        image={post.image}
      />
      <BreadcrumbSchema
        items={[
          { name: "Blog", url: "/blog" },
          { name: post.title, url: `/blog/${post.slug}` },
        ]}
      />
      <Nav showBack />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-sm text-lime-400 font-semibold mb-2 uppercase tracking-wider">
          {post.date}
        </div>
        <h1 className="text-4xl font-black text-[var(--text)] mb-8 leading-tight">
          {post.title}
        </h1>
        <article className="prose prose-invert max-w-none leading-relaxed text-[var(--text-secondary)]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </article>
      </main>
      <Footer />
    </div>
  );
}