import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getPost, getAllPosts } from "@/lib/blog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug =
    typeof params === "object" && "slug" in params
      ? (params as { slug: string }).slug
      : "";
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
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
