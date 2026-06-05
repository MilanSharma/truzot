"use client";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const posts = [
  {
    slug: "why-your-linkedin-headshot-matters",
    title: "Why Your LinkedIn Headshot Matters More Than Ever",
    excerpt:
      "In the digital age, your LinkedIn profile is often the first impression you make on recruiters, clients, and partners. A high-quality headshot can increase your profile views by up to 14x.",
    date: "May 12, 2026",
    readTime: "4 min read",
  },
  {
    slug: "tips-for-perfect-ai-training-selfies",
    title: "5 Tips for Taking the Perfect AI Training Selfies",
    excerpt:
      "The quality of your AI headshots depends entirely on the photos you upload. Learn the best lighting, angles, and expressions to ensure your AI model captures your true likeness.",
    date: "May 05, 2026",
    readTime: "3 min read",
  },
  {
    slug: "future-of-professional-photography",
    title: "The Future of Professional Photography",
    excerpt:
      "AI isn't replacing photographers; it's democratizing access to professional branding. Discover how generative AI is changing the way we think about corporate headshots.",
    date: "April 28, 2026",
    readTime: "5 min read",
  },
];

export default function BlogPage() {
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
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  {post.excerpt}
                </p>
              </article>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
