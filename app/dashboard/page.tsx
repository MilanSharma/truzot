'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

type OrderStatus = 'pending' | 'paid' | 'training' | 'generating' | 'completed' | 'failed';

interface Headshot {
  id: string;
  image_url: string;
  style?: string;
}

const STATUS_STEPS: Record<OrderStatus, { label: string; icon: string; desc: string; progress: number }> = {
  pending:    { label: 'Order received',        icon: '📋', desc: 'Your order has been placed.',                              progress: 10 },
  paid:       { label: 'Payment confirmed',     icon: '💳', desc: 'Payment confirmed. Starting AI training...',             progress: 20 },
  training:   { label: 'Training your AI model',icon: '🧠', desc: 'Our AI is learning your face. This takes ~30 minutes.',   progress: 45 },
  generating: { label: 'Generating headshots',  icon: '✨', desc: 'Almost there! Generating your photos now.',              progress: 80 },
  completed:  { label: 'Your headshots are ready!', icon: '🎉', desc: 'Download your professional headshots below.',        progress: 100 },
  failed:     { label: 'Something went wrong',  icon: '⚠️', desc: 'We encountered an error. Please contact support.',       progress: 0 },
};

function DashboardContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [headshots, setHeadshots] = useState<Headshot[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, target: 0 });

  const triggerBatchGeneration = useCallback(async () => {
    if (!orderId || status !== 'generating') return;
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status) {
          setStatus(data.status);
          if (data.count !== undefined) {
            setGenerationProgress({ current: data.count, target: data.target });
          }
        }
      }
      // If still generating, safely schedule the next batch in 2 seconds
      if (data.status === 'generating') {
        setTimeout(() => {
          triggerBatchGeneration();
        }, 2000);
      }
    } catch (err) {
      console.error('Batch generation fetch error:', err);
  }, [orderId, status]);

  const fetchStatus = useCallback(async () => {
    if (!orderId) return;
    const res = await fetch(`/api/order-status?orderId=${orderId}`);
    if (!res.ok) return;
    const data = await res.json();
    setStatus(data.status);

    if (data.status === 'generating') {
      const { count } = await supabase
        .from('headshots')
        .select('id', { count: 'exact', head: true })
        .eq('order_id', orderId);
      setGenerationProgress(prev => ({ current: count ?? 0, target: prev.target || 40 }));
    }
  }, [orderId]);

  const fetchHeadshots = useCallback(async () => {
    if (!orderId) return;
    const { data } = await supabase
      .from('headshots')
      .select('id, image_url, style')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });
    if (data) setHeadshots(data);
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, [orderId, fetchStatus]);

  useEffect(() => {
    if (status === 'completed' || status === 'failed') {
      fetchHeadshots();
    }
  }, [status, fetchHeadshots]);

  useEffect(() => {
    if (status === 'generating') {
      triggerBatchGeneration();
    }
  }, [status, triggerBatchGeneration]);

  const step = STATUS_STEPS[status];
  const displayProgress = status === 'generating' && generationProgress.target > 0
    ? Math.round((generationProgress.current / generationProgress.target) * 100)
    : step.progress;

  const downloadAll = () => {
    headshots.forEach((h, i) => {
      const link = document.createElement('a');
      link.href = h.image_url;
      link.download = `truzot-headshot-${i + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#faf7f2', fontFamily: 'DM Sans, sans-serif', color: '#0a0a0a' }}>
      <nav style={{ padding: '1.25rem 4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
        <Link href="/" style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 900, color: '#0a0a0a', textDecoration: 'none', letterSpacing: '-0.02em' }}>
          Tru<span style={{ color: '#c9a84c' }}>zot</span>
        </Link>
        {status === 'completed' && (
          <button onClick={downloadAll} style={{ background: '#0a0a0a', color: '#f5f0e8', padding: '0.6rem 1.4rem', borderRadius: '2px', border: 'none', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
            ↓ Download all ({headshots.length})
          </button>
        )}
      </nav>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '4rem 2rem' }}>
        {!orderId ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤔</div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>No order found</h1>
            <p style={{ color: '#6b6560', marginBottom: '2rem' }}>Please check your email for your order confirmation link.</p>
            <Link href="/upload" style={{ background: '#0a0a0a', color: '#f5f0e8', padding: '0.875rem 2rem', borderRadius: '2px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
              Create a new order →
            </Link>
          </div>
        ) : (
          <>
            <div style={{ background: '#ede8df', border: `1px solid ${status === 'failed' ? '#fca5a5' : 'rgba(10,10,10,0.1)'}`, borderRadius: '4px', padding: '2rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '2rem', flexShrink: 0 }}>{step.icon}</div>
                <div>
                  <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>{step.label}</h2>
                  <p style={{ fontSize: '0.9rem', color: '#6b6560', fontWeight: 300 }}>
                    {status === 'generating' && generationProgress.target > 0
                      ? `Generating your photos in real-time... (${generationProgress.current} of ${generationProgress.target} completed)`
                      : step.desc}
                  </p>
                </div>
              </div>
              {status !== 'failed' && (
                <div>
                  <div style={{ height: '4px', background: 'rgba(10,10,10,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${displayProgress}%`, background: status === 'completed' ? '#c9a84c' : '#0a0a0a', borderRadius: '2px', transition: 'width 1s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b6560' }}>
                    <span>Order placed</span><span>Training</span><span>Generating</span><span>Ready!</span>
                  </div>
                </div>
              )}
              {['paid', 'training', 'generating'].includes(status) && (
                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.825rem', color: '#6b6560' }}>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⚙️</span>
                  Preparing configurations dynamically...
                </div>
              )}
            </div>

            {headshots.length > 0 && (
              <>
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700 }}>Your {headshots.length} headshots</h3>
                  <button onClick={downloadAll} style={{ background: '#0a0a0a', color: '#f5f0e8', padding: '0.6rem 1.25rem', borderRadius: '2px', border: 'none', fontSize: '0.825rem', fontWeight: 500, cursor: 'pointer' }}>
                    ↓ Download all
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                  {headshots.map((h) => (
                    <div key={h.id} onClick={() => setSelected(h.image_url)} style={{ aspectRatio: '3/4', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer', position: 'relative', background: '#d4c9b8' }}>
                      <img src={h.image_url} alt="AI headshot" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      />
                      <a href={h.image_url} download target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(10,10,10,0.75)', color: '#fff', padding: '4px 8px', borderRadius: '2px', fontSize: '0.7rem', textDecoration: 'none' }}>
                        ↓
                      </a>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#6b6560', textAlign: 'center', fontWeight: 300 }}>
                  💡 Your photos will be available for download for 30 days, then permanently deleted from our servers.
                </p>
              </>
            )}

            {status === 'completed' && (
              <div style={{ marginTop: '2rem', background: '#0a0a0a', color: '#f5f0e8', borderRadius: '4px', padding: '1.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Love your headshots? Tell people.</div>
                  <div style={{ fontSize: '0.825rem', opacity: 0.6, fontWeight: 300 }}>Share on LinkedIn or TikTok — your followers will ask where you got them.</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a href={`https://www.linkedin.com/shareArticle?mini=true&url=https://truzot.com&title=Got%20my%20AI%20headshots%20on%20Truzot!`} target="_blank" rel="noreferrer"
                    style={{ background: '#0077b5', color: '#fff', padding: '0.6rem 1.25rem', borderRadius: '2px', fontSize: '0.825rem', textDecoration: 'none', fontWeight: 500 }}>
                    Share on LinkedIn
                  </a>
                  <a href="https://truzot.com" target="_blank" rel="noreferrer"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#f5f0e8', padding: '0.6rem 1.25rem', borderRadius: '2px', fontSize: '0.825rem', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)' }}>
                    truzot.com
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'pointer' }}>
          <img src={selected} alt="Headshot" style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain', borderRadius: '4px' }} />
          <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1rem', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  return <Suspense><DashboardContent /></Suspense>;
}
