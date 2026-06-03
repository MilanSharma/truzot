'use client';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div style={ minHeight: '100vh', background: '#faf7f2', fontFamily: 'DM Sans, sans-serif', color: '#0a0a0a' }>
      
      <nav style={{ padding: '1.25rem 4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
        <Link href="/" style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 900, color: '#0a0a0a', textDecoration: 'none', letterSpacing: '-0.02em' }}>
          Tru<span style={{ color: '#c9a84c' }}>zot</span>
        </Link>
        <Link href="/" style={{ fontSize: '0.875rem', color: '#6b6560', textDecoration: 'none', fontWeight: 500 }}>← Back to Home</Link>
      </nav>
    
      <div style={ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem' }>
        <h1 style={ fontFamily: 'Playfair Display, serif', fontSize: '3rem', fontWeight: 700, marginBottom: '1.5rem' }>Contact Us</h1>
        <p style={ fontSize: '1.1rem', lineHeight: 1.8, color: '#6b6560', marginBottom: '3rem', fontWeight: 300 }>
          Have a question, need a refund, or just want to say hello? We're here to help.
        </p>
        
        <div style={ display: 'grid', mdGridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }>
          <div style={ background: '#ede8df', padding: '2rem', borderRadius: '4px' }>
            <div style={ fontSize: '2rem', marginBottom: '1rem' }>📧</div>
            <h3 style={ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }>Email Support</h3>
            <p style={ color: '#6b6560', marginBottom: '1rem', fontSize: '0.9rem' }>For order inquiries, refunds, or technical issues.</p>
            <a href="mailto:hello@truzot.com" style={ color: '#0a0a0a', fontWeight: 600, textDecoration: 'underline' }>hello@truzot.com</a>
          </div>

          <div style={ background: '#ede8df', padding: '2rem', borderRadius: '4px' }>
            <div style={ fontSize: '2rem', marginBottom: '1rem' }>⏱️</div>
            <h3 style={ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }>Support Hours</h3>
            <p style={ color: '#6b6560', marginBottom: '1rem', fontSize: '0.9rem' }>We typically respond within a few hours.</p>
            <div style={ color: '#0a0a0a', fontWeight: 600 }>Mon - Fri: 9 AM - 5 PM EST</div>
          </div>
        </div>

        <div style={ background: '#0a0a0a', color: '#f5f0e8', padding: '2.5rem', borderRadius: '4px', textAlign: 'center' }>
          <h3 style={ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }>Need immediate help with an order?</h3>
          <p style={ opacity: 0.8, marginBottom: '1.5rem', fontWeight: 300 }>
            Please include your <strong>Order ID</strong> (found in your confirmation email) so we can assist you faster.
          </p>
          <a href="mailto:hello@truzot.com?subject=Help%20with%20my%20Order" style={ background: '#c9a84c', color: '#0a0a0a', padding: '0.875rem 2rem', borderRadius: '2px', textDecoration: 'none', fontWeight: 600 }>
            Contact Support →
          </a>
        </div>
      </div>
    </div>
  );
}
