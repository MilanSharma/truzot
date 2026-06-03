'use client';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div style={ minHeight: '100vh', background: '#faf7f2', fontFamily: 'DM Sans, sans-serif', color: '#0a0a0a' }>
      
      <nav style={{ padding: '1.25rem 4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
        <Link href="/" style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 900, color: '#0a0a0a', textDecoration: 'none', letterSpacing: '-0.02em' }}>
          Tru<span style={{ color: '#c9a84c' }}>zot</span>
        </Link>
        <Link href="/" style={{ fontSize: '0.875rem', color: '#6b6560', textDecoration: 'none', fontWeight: 500 }}>← Back to Home</Link>
      </nav>
    
      <div style={ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem' }>
        <h1 style={ fontFamily: 'Playfair Display, serif', fontSize: '3rem', fontWeight: 700, marginBottom: '1.5rem' }>About Truzot</h1>
        <p style={ fontSize: '1.2rem', lineHeight: 1.8, color: '#6b6560', marginBottom: '2rem', fontWeight: 300 }>
          We believe that everyone deserves a professional headshot, regardless of their budget or schedule.
        </p>
        
        <div style={ background: '#ede8df', padding: '2rem', borderRadius: '4px', marginBottom: '2rem' }>
          <h2 style={ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }>Our Mission</h2>
          <p style={ lineHeight: 1.8, color: '#4a4540' }>
            Traditional headshots cost hundreds of dollars and require taking time off work to visit a studio, 
            deal with awkward posing, and wait weeks for retouching. Truzot was founded to democratize professional branding. 
            By leveraging the latest advancements in generative AI, we deliver studio-quality results in under 60 minutes, 
            right from the comfort of your home.
          </p>
        </div>

        <div style={ background: '#ede8df', padding: '2rem', borderRadius: '4px', marginBottom: '2rem' }>
          <h2 style={ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }>How It Works</h2>
          <p style={ lineHeight: 1.8, color: '#4a4540', marginBottom: '1rem' }>
            Our technology uses advanced LoRA (Low-Rank Adaptation) training on state-of-the-art Flux models. 
            When you upload your selfies, our AI learns your unique facial features, bone structure, and expressions.
          </p>
          <p style={ lineHeight: 1.8, color: '#4a4540' }>
            Once your personal model is trained, we generate dozens of variations across different styles, 
            lighting setups, and backgrounds—ensuring you get the perfect shot for LinkedIn, resumes, or company profiles.
          </p>
        </div>

        <div style={ textAlign: 'center', marginTop: '3rem' }>
          <Link href="/upload" style={ background: '#0a0a0a', color: '#f5f0e8', padding: '1rem 2rem', borderRadius: '2px', textDecoration: 'none', fontSize: '1rem', fontWeight: 500 }>
            Get Your Headshots Now →
          </Link>
        </div>
      </div>
    </div>
  );
}
