'use client';
import Link from 'next/link';

const posts = [
  {
    title: "Why Your LinkedIn Headshot Matters More Than Ever",
    excerpt: "In the digital age, your LinkedIn profile is often the first impression you make on recruiters, clients, and partners. A high-quality headshot can increase your profile views by up to 14x.",
    date: "May 12, 2026",
    readTime: "4 min read"
  },
  {
    title: "5 Tips for Taking the Perfect AI Training Selfies",
    excerpt: "The quality of your AI headshots depends entirely on the photos you upload. Learn the best lighting, angles, and expressions to ensure your AI model captures your true likeness.",
    date: "May 05, 2026",
    readTime: "3 min read"
  },
  {
    title: "The Future of Professional Photography",
    excerpt: "AI isn't replacing photographers; it's democratizing access to professional branding. Discover how generative AI is changing the way we think about corporate headshots.",
    date: "April 28, 2026",
    readTime: "5 min read"
  }
];

export default function BlogPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#faf7f2', fontFamily: 'DM Sans, sans-serif', color: '#0a0a0a' }}>
      <nav style={{ padding: '1.25rem 4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
        <Link href="/" style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 900, color: '#0a0a0a', textDecoration: 'none', letterSpacing: '-0.02em' }}>
          Tru<span style={{ color: '#c9a84c' }}>zot</span>
        </Link>
        <Link href="/" style={{ fontSize: '0.875rem', color: '#6b6560', textDecoration: 'none', fontWeight: 500 }}>← Back to Home</Link>
      </nav>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '3rem', fontWeight: 700, marginBottom: '0.5rem' }}>The Truzot Blog</h1>
        <p style={{ fontSize: '1.1rem', color: '#6b6560', marginBottom: '3rem', fontWeight: 300 }}>
          Tips, tricks, and insights on professional branding and AI technology.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {posts.map((post, i) => (
            <article key={i} style={{ background: '#fff', padding: '2rem', borderRadius: '4px', border: '1px solid rgba(10,10,10,0.08)', transition: 'transform 0.2s', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ fontSize: '0.8rem', color: '#c9a84c', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {post.date} · {post.readTime}
              </div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                {post.title}
              </h2>
              <p style={{ color: '#6b6560', lineHeight: 1.6, fontWeight: 300 }}>
                {post.excerpt}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
