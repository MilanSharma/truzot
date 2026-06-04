'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function TeamPage() {
  const [email, setEmail] = useState('');
  const [invited, setInvited] = useState(false);

  const handleInvite = async () => {
    // Call API to create team and invite admin
    setInvited(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#faf7f2', fontFamily: 'DM Sans, sans-serif' }}>
      <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid #eee' }}>
        <Link href="/" style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>Truzot</Link>
      </nav>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold' }}>Team Headshots, Unified Brand</h1>
        <p style={{ fontSize: '1.25rem', color: '#4a5568', marginBottom: '2rem' }}>
          Create consistent, professional headshots for your entire company.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: '2rem', marginBottom: '3rem' }}>
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3>Admin Dashboard</h3>
            <p>Invite employees, set branding guidelines, track progress.</p>
          </div>
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3>Bulk Pricing</h3>
            <p>Volume discounts starting at 10+ employees.</p>
          </div>
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3>API & SSO</h3>
            <p>Enterprise‑grade security and automation.</p>
          </div>
        </div>
        <div style={{ background: '#f0f4f8', padding: '2rem', borderRadius: '8px' }}>
          <h2>Start your team trial</h2>
          <input type="email" placeholder="work email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '0.5rem', marginRight: '0.5rem', width: '250px' }} />
          <button onClick={handleInvite} style={{ background: '#0a0a0a', color: '#fff', padding: '0.5rem 1rem', borderRadius: '4px' }}>Request Demo</button>
          {invited && <p>Thanks! We'll contact you shortly.</p>}
        </div>
      </div>
    </div>
  );
}
