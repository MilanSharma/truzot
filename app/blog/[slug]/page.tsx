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
    title: `${post.title} - Truzot Blog`,
    description: post.excerpt || `Read "${post.title}" on the Truzot Blog.`,
    alternates: {
      canonical: `${SITE_CONFIG.url}/blog/${post.slug}`,
    },
    openGraph: {
      title: `${post.title} - Truzot Blog`,
      description: post.excerpt || `Read "${post.title}" on the Truzot Blog.`,
      url: `${SITE_CONFIG.url}/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      images: post.image
        ? [{ url: post.image, width: 1200, height: 630 }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} - Truzot Blog`,
      description: post.excerpt || `Read "${post.title}" on the Truzot Blog.`,
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
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
      <main role="main" className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-sm text-blue-600 font-semibold mb-2 uppercase tracking-wider">
          {post.date}
        </div>
        <h1 className="text-4xl font-bold mb-8 text-slate-900 dark:text-white leading-tight">
          {post.title}
        </h1>
        <div className="prose prose-slate dark:prose-invert max-w-none leading-relaxed text-slate-600 dark:text-slate-400">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>
      </main>
      <Footer />
    </div>
  );
}
