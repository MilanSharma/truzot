"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const POSTS: Record<string, { title: string; date: string; content: string }> =
  {
    "why-your-linkedin-headshot-matters": {
      title: "Why Your LinkedIn Headshot Matters More Than Ever",
      date: "May 12, 2026",
      content: `
      <p>In the digital age, your LinkedIn profile is often the first impression you make on recruiters, clients, and partners. Studies show that profiles with professional headshots receive up to 14x more profile views than those without.</p>
      <p>A high-quality headshot conveys trustworthiness, competence, and approachability. It's not just about looking good — it's about signaling that you take your professional brand seriously.</p>
      <h2>What Makes a Great LinkedIn Headshot?</h2>
      <p>Your LinkedIn photo should be current, professional, and approachable. Avoid group photos, cropped wedding pictures, or overly casual selfies. Invest in a proper headshot that reflects the image you want to project.</p>
      <p>With AI headshot generation, you can now get studio-quality results from the comfort of your home — no photographer, studio rental, or expensive equipment required.</p>
    `,
    },
    "tips-for-perfect-ai-training-selfies": {
      title: "5 Tips for Taking the Perfect AI Training Selfies",
      date: "May 5, 2026",
      content: `
      <p>The quality of your AI-generated headshots depends almost entirely on the photos you upload to train the model. Here are five tips to get the best results:</p>
      <h2>1. Use Natural Lighting</h2>
      <p>Window light is your best friend. Stand facing a large window and avoid overhead fluorescent lights that create unflattering shadows.</p>
      <h2>2. Capture Multiple Angles</h2>
      <p>Take photos from straight on, three-quarter turns, and slight profile views. This gives the AI enough data to understand your facial structure from all angles.</p>
      <h2>3. Vary Your Expressions</h2>
      <p>Include serious, smiling, and neutral expressions. This helps the AI generate natural-looking headshots that capture your personality.</p>
      <h2>4. Avoid Busy Backgrounds</h2>
      <p>Plain walls or simple backgrounds work best. The AI needs to focus on your face, not the clutter behind you.</p>
      <h2>5. Wear Different Outfits</h2>
      <p>Change clothes between shots to give the AI more flexibility when generating your final headshots in different styles.</p>
    `,
    },
    "future-of-professional-photography": {
      title: "The Future of Professional Photography",
      date: "April 28, 2026",
      content: `
      <p>AI isn't replacing photographers — it's democratizing access to professional branding. The days of expensive studio sessions and week-long wait times for a single usable headshot are fading.</p>
      <p>Generative AI models like Flux LoRA can now produce studio-quality headshots by learning your facial features from a set of training photos. The result is a collection of professional images in multiple styles, backgrounds, and outfits — all generated in minutes.</p>
      <h2>Why This Matters</h2>
      <p>For professionals, this means affordable, instant access to high-quality branding material. For photographers, AI becomes a powerful tool to streamline workflows and offer more to clients.</p>
      <p>The future isn't AI versus photographers — it's photographers who use AI versus those who don't.</p>
    `,
    },
  };

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const post = POSTS[slug];

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
          Post not found
        </h1>
        <Link href="/blog" className="text-blue-600 hover:underline">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Nav showBack />
      <article className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-sm text-blue-600 font-semibold mb-2 uppercase tracking-wider">
          {post.date}
        </div>
        <h1 className="text-4xl font-bold mb-8 text-slate-900 dark:text-white leading-tight">
          {post.title}
        </h1>
        <div
          className="prose prose-slate dark:prose-invert max-w-none leading-relaxed text-slate-600 dark:text-slate-400"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
      <Footer />
    </div>
  );
}
