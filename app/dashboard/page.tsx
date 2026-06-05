'use client';
import { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { HEADSHOT_CATEGORIES, PLANS } from '@/lib/plans';
import {
  Download, Clock, CheckCircle, Loader2, Plus, Image as ImageIcon,
  TrendingUp, Zap, Shield, ArrowRight, AlertCircle, Sparkles, Mail
} from 'lucide-react';

type OrderStatus = 'pending' | 'paid' | 'training' | 'generating' | 'completed' | 'failed';

interface Headshot {
  id: string;
  image_url: string;
  style?: string;
  category?: string;
}

interface Order {
  id: string;
  plan: string;
  status: OrderStatus;
  created_at: string;
  email?: string;
  headshots_count?: number;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order');

  const [headshots, setHeadshots] = useState<Headshot[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [generationProgress, setGenerationProgress] = useState({ count: 0, target: 0 });
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch the specific order by ID (works regardless of user_id)
  const fetchOrderById = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.error('Order fetch error:', error);
      return null;
    }
    return data as Order;
  }, []);

  // Fetch headshots for an order
  const fetchHeadshots = useCallback(async (id: string) => {
    const { data } = await supabase
      .from('headshots')
      .select('id, image_url, style')
      .eq('order_id', id)
      .order('created_at', { ascending: true });
    if (data) setHeadshots(data);
    return data?.length || 0;
  }, []);

  // Call the generate API to trigger batch generation
  const triggerGeneration = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id }),
      });
      const data = await res.json();
      
      if (data.status === 'completed') {
        setGenerationStatus('completed');
        await fetchHeadshots(id);
        return 'completed';
      }
      if (data.status === 'generating') {
        setGenerationProgress({ count: data.count || 0, target: data.target || 0 });
        setGenerationStatus('generating');
      }
      if (data.status === 'failed') {
        setGenerationStatus('failed');
      }
      return data.status;
    } catch (err) {
      console.error('Generation trigger error:', err);
      return 'error';
    }
  }, [fetchHeadshots]);

  // Polling loop for generation
  const startPolling = useCallback((id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    
    pollRef.current = setInterval(async () => {
      const order = await fetchOrderById(id);
      if (!order) return;
      
      setCurrentOrder(order);
      
      if (order.status === 'completed') {
        await fetchHeadshots(id);
        setGenerationStatus('completed');
        if (pollRef.current) clearInterval(pollRef.current);
        return;
      }
      
      if (order.status === 'failed') {
        setGenerationStatus('failed');
        if (pollRef.current) clearInterval(pollRef.current);
        return;
      }
      
      if (order.status === 'generating') {
        const result = await triggerGeneration(id);
        if (result === 'completed') {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } else if (order.status === 'training') {
        setGenerationStatus('training');
      }
    }, 5000); // Poll every 5 seconds
  }, [fetchOrderById, fetchHeadshots, triggerGeneration]);

  // Check authentication and load data
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
        // Fetch orders by user_id (for logged-in users with past orders)
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        if (data) setOrders(data as Order[]);
      }
      
      // If we have an orderId in URL, fetch it directly (works for email-based checkouts)
      if (orderId) {
        const order = await fetchOrderById(orderId);
        if (order) {
          setCurrentOrder(order);
          await fetchHeadshots(orderId);
          
          // Start polling if order is still in progress
          if (['training', 'generating'].includes(order.status)) {
            startPolling(orderId);
          }
        }
      }
      
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setUser(session.user);
    });

    return () => {
      subscription.unsubscribe();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [router, orderId, fetchOrderById, fetchHeadshots, startPolling]);

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

  const downloadSingle = async (url: string) => {
    window.location.href = `/api/download?imageUrl=${encodeURIComponent(url)}`;
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'generating':
      case 'training': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default: return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'failed': return 'bg-red-50 text-red-700 border-red-200';
      case 'generating':
      case 'training': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'completed': return 'Ready';
      case 'failed': return 'Failed';
      case 'generating': return 'Generating';
      case 'training': return 'Training AI';
      case 'paid': return 'Processing';
      default: return 'Pending';
    }
  };

  const getPlanInfo = (planId: string) => {
    return PLANS[planId as keyof typeof PLANS] || { name: planId, shots: 0 };
  };

  const filteredHeadshots = activeCategory === 'all'
    ? headshots
    : headshots.filter(h => h.category === activeCategory);

  const completedOrders = orders.filter(o => o.status === 'completed');
  const inProgressOrders = orders.filter(o => ['training', 'generating', 'paid'].includes(o.status));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              TRUZOT
            </Link>
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <span className="text-sm text-slate-600 hidden sm:inline">{user.email}</span>
                  <button
                    onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                    className="text-sm text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Single Order View - This is what shows when ?order= is in URL */}
        {orderId && currentOrder && (
          <div>
            <div className="mb-8">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-slate-600 hover:text-slate-900 mb-4 flex items-center gap-2"
              >
                ← Back to all headshots
              </button>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    {getPlanInfo(currentOrder.plan).name}
                  </h1>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(currentOrder.status)}`}>
                      {getStatusIcon(currentOrder.status)}
                      {getStatusText(currentOrder.status)}
                    </span>
                    <span className="text-slate-600 text-sm">
                      {new Date(currentOrder.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {currentOrder.status === 'completed' && (
                  <button
                    onClick={downloadAll}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    <Download className="w-5 h-5" />
                    {downloading ? 'Preparing...' : `Download All (${headshots.length})`}
                  </button>
                )}
              </div>
            </div>

            {/* Training State */}
            {currentOrder.status === 'training' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Training Your AI Model</h2>
                <p className="text-slate-600 max-w-lg mx-auto mb-6">
                  We're analyzing your photos to create your personalized AI model. This usually takes 10-30 minutes.
                  We'll email you at <strong>{currentOrder.email}</strong> when your headshots are ready.
                </p>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden max-w-md mx-auto">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse" style={{ width: '30%' }} />
                </div>
                <p className="text-sm text-slate-500 mt-4">This page will update automatically when ready</p>
              </div>
            )}

            {/* Generating State with Progress */}
            {currentOrder.status === 'generating' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-indigo-600 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">Generating Your Headshots</h2>
                  <p className="text-slate-600">
                    Your AI model is ready! Creating {generationProgress.target} professional headshots...
                  </p>
                </div>
                
                <div className="max-w-2xl mx-auto">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-semibold text-blue-600">
                      {generationProgress.count} / {generationProgress.target}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${generationProgress.target > 0 ? (generationProgress.count / generationProgress.target) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-500 mt-4 text-center">
                    Generating in batches of 5. This page updates automatically.
                  </p>
                </div>

                {/* Show headshots as they come in */}
                {headshots.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-semibold text-slate-900 mb-4">Preview ({headshots.length} ready)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {headshots.map((h) => (
                        <div key={h.id} className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100">
                          <img
                            src={h.image_url}
                            alt="AI headshot"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            onClick={() => setSelected(h.image_url)}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button
                              onClick={(e) => { e.stopPropagation(); downloadSingle(h.image_url); }}
                              className="bg-white text-slate-900 px-3 py-2 rounded-lg font-semibold text-sm flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Failed State */}
            {currentOrder.status === 'failed' && (
              <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Something went wrong</h2>
                <p className="text-slate-600 mb-6">Your order failed to process. Please contact support for a refund.</p>
                <Link href="/contact" className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition">
                  Contact Support
                </Link>
              </div>
            )}

            {/* Completed State - Show Headshots */}
            {currentOrder.status === 'completed' && headshots.length > 0 && (
              <div>
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Filter by category:</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveCategory('all')}
                      className={`px-4 py-2 rounded-lg font-medium transition ${activeCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300'}`}
                    >
                      All ({headshots.length})
                    </button>
                    {HEADSHOT_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${activeCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300'}`}
                      >
                        {cat.icon} {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredHeadshots.map((h) => (
                    <div key={h.id} className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={h.image_url}
                        alt="AI headshot"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onClick={() => setSelected(h.image_url)}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadSingle(h.image_url); }}
                          className="bg-white text-slate-900 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-slate-100 transition"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed but no headshots (edge case) */}
            {currentOrder.status === 'completed' && headshots.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">No headshots found</h3>
                <p className="text-slate-600 mb-6">Something went wrong. Please contact support.</p>
                <Link href="/contact" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
                  Contact Support
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Dashboard Overview (no orderId) */}
        {!orderId && (
          <div>
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <h1 className="text-4xl font-bold text-slate-900 mb-3">Welcome to Truzot!</h1>
                <p className="text-lg text-slate-600 mb-8">Let's create your professional AI headshots in minutes.</p>
                <div className="grid md:grid-cols-3 gap-6 mb-10 max-w-4xl mx-auto">
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <Zap className="w-8 h-8 text-blue-600 mb-3" />
                    <div className="text-2xl font-bold text-slate-900">10-30 min</div>
                    <div className="text-sm text-slate-600">Delivery Time</div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <TrendingUp className="w-8 h-8 text-green-600 mb-3" />
                    <div className="text-2xl font-bold text-slate-900">8x cheaper</div>
                    <div className="text-sm text-slate-600">Than a photographer</div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <Shield className="w-8 h-8 text-purple-600 mb-3" />
                    <div className="text-2xl font-bold text-slate-900">100%</div>
                    <div className="text-sm text-slate-600">Satisfaction Guarantee</div>
                  </div>
                </div>
                <Link href="/upload" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition">
                  <Plus className="w-5 h-5" />
                  Create Your First Headshots
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">My Headshots</h1>
                    <p className="text-slate-600">Manage and download your professional headshots</p>
                  </div>
                  <Link href="/upload" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
                    <Plus className="w-5 h-5" />
                    New Headshots
                  </Link>
                </div>

                {inProgressOrders.length > 0 && (
                  <div className="mb-10">
                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      In Progress
                    </h2>
                    <div className="grid gap-4">
                      {inProgressOrders.map(order => (
                        <Link key={order.id} href={`/dashboard?order=${order.id}`} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition block">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                {getStatusIcon(order.status)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{getPlanInfo(order.plan).name}</div>
                                <div className="text-sm text-slate-600">Ordered {new Date(order.created_at).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {completedOrders.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Completed ({completedOrders.length})
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {completedOrders.map(order => (
                        <Link key={order.id} href={`/dashboard?order=${order.id}`} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition group">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="font-bold text-slate-900 text-lg">{getPlanInfo(order.plan).name}</div>
                              <div className="text-sm text-slate-600">{new Date(order.created_at).toLocaleDateString()}</div>
                            </div>
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                          </div>
                          <div className="text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                            View headshots →
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selected && (
        <div onClick={() => setSelected(null)} className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <img src={selected} alt="Headshot" className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg" />
          <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-2xl transition">×</button>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return <Suspense><DashboardContent /></Suspense>;
}
