'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) setError(error.message);
      else {
        alert('Check your email to confirm your account!');
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else router.push('/dashboard');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#faf7f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ background: '#fff', padding: '3rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '400px', width: '90%' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>
          Tru<span style={{ color: '#c9a84c' }}>zot</span>
        </h1>
        <p style={{ textAlign: 'center', color: '#6b6560', marginBottom: '2rem' }}>
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '1rem' }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '1rem' }}
            />
          </div>
          
          {error && (
            <div style={{ background: '#fee', color: '#c00', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          
          <button
            type="submit"
            style={{ width: '100%', background: '#0a0a0a', color: '#fff', padding: '0.75rem', border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: 500, cursor: 'pointer' }}
          >
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b6560' }}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => setIsSignUp(!isSignUp)} style={{ background: 'none', border: 'none', color: '#0a0a0a', textDecoration: 'underline', cursor: 'pointer' }}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
