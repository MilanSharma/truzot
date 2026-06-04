'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { HEADSHOT_CATEGORIES, PLANS } from '@/lib/plans';

type OrderStatus = 'pending' | 'paid' | 'training' | 'generating' | 'completed' | 'failed';
type PlanType = 'basic' | 'pro' | 'executive';

interface Headshot {
  id: string;
  image_url: string;
  style?: string;
  category?: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order');
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [headshots, setHeadshots] = useState<Headshot[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [downloading, setDownloading] = useState(false);

  // Check authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !orderId) {
        router.push('/login');
      } else if (session) {
        setUser(session.user);
        fetchUserOrders(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !orderId) {
        router.push('/login');
      } else if (session) {
        setUser(session.user);
        fetchUserOrders(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, orderId]);

  const fetchUserOrders = async (userId: string) => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

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
    if (orderId) fetchHeadshots();
  }, [orderId, fetchHeadshots]);

  const downloadAll = async () => {
    setDownloading(true);
    try {
      window.location.href = `/api/download?orderId=${orderId}`;
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const downloadSingle = async (url: string, index: number) => {
    window.location.href = `/api/download?imageUrl=${encodeURIComponent(url)}`;
  };

  const filteredHeadshots = activeCategory === 'all' 
    ? headshots 
    : headshots.filter(h => h.category === activeCategory);

  const plan = orderId && orders.find(o => o.id === orderId)?.plan;

  return (
    <div style={{ minHeight: '100vh', background: '#faf7f2', fontFamily: 'DM Sans, sans-serif', color: '#0a0a0a' }}>
      {/* Navigation with user menu */}
      <nav style={{ padding: '1.25rem 4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
        <Link href="/" style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 900, color: '#0a0a0a', textDecoration: 'none' }}>
          Tru<span style={{ color: '#c9a84c' }}>zot</span>
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {user && (
            <>
              <span style={{ fontSize: '0.875rem', color: '#6b6560' }}>{user.email}</span>
              <button 
                onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                style={{ background: 'transparent', border: '1px solid rgba(10,10,10,0.2)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
              >
                Sign Out
              </button>
            </>
          )}
          {status === 'completed' && (
            <button 
              onClick={downloadAll} 
              disabled={downloading}
              style={{ background: '#0a0a0a', color: '#f5f0e8', padding: '0.6rem 1.4rem', borderRadius: '2px', border: 'none', cursor: 'pointer' }}
            >
              {downloading ? 'Preparing...' : `↓ Download All (${headshots.length})`}
            </button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
        {!orderId && orders.length > 0 && (
          <>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', marginBottom: '2rem' }}>My Orders</h1>
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '3rem' }}>
              {orders.map(order => (
                <Link 
                  key={order.id} 
                  href={`/dashboard?order=${order.id}`}
                  style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', textDecoration: 'none', color: '#0a0a0a', border: '1px solid #e0e0e0' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{PLANS[order.plan as PlanType]?.name || order.plan}</strong>
                      <div style={{ fontSize: '0.875rem', color: '#6b6560', marginTop: '0.25rem' }}>Ordered: {new Date(order.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '20px', 
                      background: order.status === 'completed' ? '#10b981' : '#f59e0b',
                      color: '#fff',
                      fontSize: '0.75rem'
                    }}>
                      {order.status}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {orderId ? (
          <>
            {/* Headshot Categories Filter */}
            {headshots.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Filter by use case:</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => setActiveCategory('all')}
                    style={{ 
                      padding: '0.5rem 1rem', 
                      borderRadius: '20px', 
                      border: '1px solid rgba(10,10,10,0.2)',
                      background: activeCategory === 'all' ? '#0a0a0a' : 'transparent',
                      color: activeCategory === 'all' ? '#fff' : '#0a0a0a',
                      cursor: 'pointer'
                    }}
                  >
                    All ({headshots.length})
                  </button>
                  {HEADSHOT_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      style={{ 
                        padding: '0.5rem 1rem', 
                        borderRadius: '20px', 
                        border: '1px solid rgba(10,10,10,0.2)',
                        background: activeCategory === cat.id ? '#0a0a0a' : 'transparent',
                        color: activeCategory === cat.id ? '#fff' : '#0a0a0a',
                        cursor: 'pointer'
                      }}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Headshots Grid with Download Buttons */}
            {filteredHeadshots.length > 0 && (
              <>
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700 }}>
                    Your {filteredHeadshots.length} headshots
                    {activeCategory !== 'all' && ` for ${activeCategory}`}
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {filteredHeadshots.map((h, idx) => (
                    <div key={h.id} style={{ position: 'relative', cursor: 'pointer' }}>
                      <img 
                        src={h.image_url} 
                        alt="AI headshot" 
                        style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '8px' }}
                        onClick={() => setSelected(h.image_url)}
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadSingle(h.image_url, idx); }}
                        style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '8px',
                          background: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ↓ Download
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <h2>No order selected</h2>
            <p style={{ color: '#6b6560', marginTop: '1rem' }}>Select an order from the list above or create a new one.</p>
            <Link href="/upload" style={{ display: 'inline-block', marginTop: '2rem', background: '#0a0a0a', color: '#fff', padding: '0.75rem 2rem', borderRadius: '4px', textDecoration: 'none' }}>
              Create New Headshots →
            </Link>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <img src={selected} alt="Headshot" style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }} />
          <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return <Suspense><DashboardContent /></Suspense>;
}
