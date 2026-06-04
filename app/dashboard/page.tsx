'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { HEADSHOT_CATEGORIES, PLANS } from '@/lib/plans';
import { 
  Camera, 
  Download, 
  Clock, 
  CheckCircle, 
  Loader2, 
  Plus, 
  Image as ImageIcon,
  TrendingUp,
  Zap,
  Shield,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

type OrderStatus = 'pending' | 'paid' | 'training' | 'generating' | 'completed' | 'failed';
type PlanType = 'basic' | 'pro' | 'executive';

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
  headshots_count?: number;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order');
  
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [headshots, setHeadshots] = useState<Headshot[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication and load data
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && !orderId) {
        router.push('/login');
        return;
      }
      
      if (session) {
        setUser(session.user);
        await fetchUserOrders(session.user.id);
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session && !orderId) {
        router.push('/login');
      } else if (session) {
        setUser(session.user);
        await fetchUserOrders(session.user.id);
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
    
    if (data) {
      const ordersWithCounts = await Promise.all(
        data.map(async (order) => {
          const { count } = await supabase
            .from('headshots')
            .select('id', { count: 'exact', head: true })
            .eq('order_id', order.id);
          
          return { ...order, headshots_count: count || 0 };
        })
      );
      setOrders(ordersWithCounts);
    }
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

  const currentOrder = orderId ? orders.find(o => o.id === orderId) : null;
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
        {/* Welcome Section - Empty State */}
        {!orderId && orders.length === 0 && (
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Welcome to Truzot!</h1>
            <p className="text-lg text-slate-600 mb-8">Let's create your professional AI headshots in minutes.</p>
            
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">10-30 min</div>
                    <div className="text-sm text-slate-600">Delivery Time</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">8x cheaper</div>
                    <div className="text-sm text-slate-600">Than a photographer</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">100%</div>
                    <div className="text-sm text-slate-600">Satisfaction Guarantee</div>
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">How It Works</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">1</div>
                  <h3 className="font-bold text-slate-900 mb-2">Upload Your Photos</h3>
                  <p className="text-slate-600 text-sm">Upload 10-20 clear selfies. Different angles and lighting work best.</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">2</div>
                  <h3 className="font-bold text-slate-900 mb-2">AI Generates Headshots</h3>
                  <p className="text-slate-600 text-sm">Our AI trains on your photos and creates professional headshots.</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">3</div>
                  <h3 className="font-bold text-slate-900 mb-2">Download & Use</h3>
                  <p className="text-slate-600 text-sm">Choose your favorites and download in high resolution.</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
              <h2 className="text-3xl font-bold mb-3">Ready to get started?</h2>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Join thousands of professionals who've upgraded their LinkedIn presence with AI-powered headshots.
              </p>
              <Link 
                href="/upload" 
                className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition"
              >
                <Plus className="w-5 h-5" />
                Create Your First Headshots
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}

        {/* Dashboard with Orders */}
        {!orderId && orders.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">My Headshots</h1>
                <p className="text-slate-600">Manage and download your professional headshots</p>
              </div>
              <Link 
                href="/upload" 
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5" />
                New Headshots
              </Link>
            </div>

            {/* In Progress Orders */}
            {inProgressOrders.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  In Progress
                </h2>
                <div className="grid gap-4">
                  {inProgressOrders.map(order => {
                    const planInfo = getPlanInfo(order.plan);
                    return (
                      <div key={order.id} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                              {getStatusIcon(order.status)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{planInfo.name}</div>
                              <div className="text-sm text-slate-600">Ordered {new Date(order.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                            <button
                              onClick={() => router.push(`/dashboard?order=${order.id}`)}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              View Details →
                            </button>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse"
                              style={{ width: order.status === 'training' ? '30%' : order.status === 'generating' ? '70%' : '10%' }}
                            />
                          </div>
                          <div className="mt-2 text-sm text-slate-600">
                            {order.status === 'training' && 'Training your AI model...'}
                            {order.status === 'generating' && 'Generating your headshots...'}
                            {order.status === 'paid' && 'Preparing to generate...'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed Orders */}
            {completedOrders.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Completed ({completedOrders.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedOrders.map(order => {
                    const planInfo = getPlanInfo(order.plan);
                    return (
                      <Link
                        key={order.id}
                        href={`/dashboard?order=${order.id}`}
                        className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="font-bold text-slate-900 text-lg">{planInfo.name}</div>
                            <div className="text-sm text-slate-600">{new Date(order.created_at).toLocaleDateString()}</div>
                          </div>
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div className="text-sm text-slate-600">
                            <span className="font-bold text-slate-900">{order.headshots_count || 0}</span> headshots
                          </div>
                          <div className="text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                            View →
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Single Order View */}
        {orderId && currentOrder && (
          <div>
            <div className="mb-8">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-slate-600 hover:text-slate-900 mb-4 flex items-center gap-2"
              >
                ← Back to all headshots
              </button>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{getPlanInfo(currentOrder.plan).name}</h1>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(currentOrder.status)}`}>
                      {getStatusIcon(currentOrder.status)}
                      {getStatusText(currentOrder.status)}
                    </span>
                    <span className="text-slate-600 text-sm">{new Date(currentOrder.created_at).toLocaleDateString()}</span>
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

            {currentOrder.status !== 'completed' && currentOrder.status !== 'failed' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin mt-1" />
                  <div>
                    <h3 className="font-bold text-blue-900 mb-2">
                      {currentOrder.status === 'training' ? 'Training Your AI Model' : 'Generating Your Headshots'}
                    </h3>
                    <p className="text-blue-700 text-sm mb-3">
                      {currentOrder.status === 'training' 
                        ? 'We\'re analyzing your photos to create your personalized AI model. This takes about 10-30 minutes.'
                        : 'Your AI model is ready! We\'re now generating professional headshots in various styles and backgrounds.'}
                    </p>
                    <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full animate-pulse"
                        style={{ width: currentOrder.status === 'training' ? '30%' : '70%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                  {filteredHeadshots.map((h, idx) => (
                    <div key={h.id} className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={h.image_url}
                        alt="AI headshot"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onClick={() => setSelected(h.image_url)}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadSingle(h.image_url, idx); }}
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

            {currentOrder.status === 'completed' && headshots.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">No headshots yet</h3>
                <p className="text-slate-600 mb-6">Something went wrong. Please contact support.</p>
                <Link href="/contact" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
                  Contact Support
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

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
