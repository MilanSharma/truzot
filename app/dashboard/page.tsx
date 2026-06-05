'use client';
import { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { PLANS } from '@/lib/plans';
import {
  Download, Clock, CheckCircle, Loader2, Plus, Image as ImageIcon,
  TrendingUp, Zap, Shield, ArrowRight, AlertCircle, Sparkles, Heart,
  Square, CheckSquare, Maximize2, Trash, Grid, HelpCircle
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
}

const TRAINING_STEPS = [
  "Analyzing portrait shapes and dimensions...",
  "Applying generative lighting layers on model coordinate grid...",
  "Training individual LoRA model values using Flux checkpoints...",
  "Injecting corporate, casual, and creative prompts into personal weights...",
  "Finalizing rendering outputs and applying resolution upscales..."
];

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
  
  // Advanced Select & Favorites State
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [logIndex, setLogIndex] = useState(0);

  const pollRef = useRef<any>(null);
  const isProcessingPoll = useRef<boolean>(false);

  // Sync log index simulation for active training screen
  useEffect(() => {
    if (currentOrder?.status === 'training') {
      const interval = setInterval(() => {
        setLogIndex((prev) => (prev + 1) % TRAINING_STEPS.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [currentOrder]);

  // Load favorites from local storage when order loads
  useEffect(() => {
    if (orderId) {
      const stored = localStorage.getItem(`truzot-favs-${orderId}`);
      if (stored) {
        try {
          setFavorites(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [orderId]);

  const toggleFavorite = (url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated: string[];
    if (favorites.includes(url)) {
      updated = favorites.filter((item) => item !== url);
    } else {
      updated = [...favorites, url];
    }
    setFavorites(updated);
    if (orderId) {
      localStorage.setItem(`truzot-favs-${orderId}`, JSON.stringify(updated));
    }
  };

  const toggleSelectImage = (url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedImages.includes(url)) {
      setSelectedImages(selectedImages.filter((item) => item !== url));
    } else {
      setSelectedImages([...selectedImages, url]);
    }
  };

  const toggleSelectAll = () => {
    const currentList = getFilteredHeadshots().map(h => h.image_url);
    const allSelected = currentList.every(url => selectedImages.includes(url));
    if (allSelected) {
      setSelectedImages(selectedImages.filter(url => !currentList.includes(url)));
    } else {
      setSelectedImages(Array.from(new Set([...selectedImages, ...currentList])));
    }
  };

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

  const fetchHeadshots = useCallback(async (id: string) => {
    const { data } = await supabase
      .from('headshots')
      .select('id, image_url, style, category')
      .eq('order_id', id)
      .order('created_at', { ascending: true });
    if (data) setHeadshots(data);
    return data?.length || 0;
  }, []);

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

  const startPolling = useCallback((id: string) => {
    if (pollRef.current) clearTimeout(pollRef.current);
    
    const pollFunc = async () => {
      if (isProcessingPoll.current) return;
      isProcessingPoll.current = true;

      try {
        const order = await fetchOrderById(id);
        if (!order) {
          isProcessingPoll.current = false;
          pollRef.current = setTimeout(pollFunc, 5000);
          return;
        }
        
        setCurrentOrder(order);
        
        if (order.status === 'completed') {
          await fetchHeadshots(id);
          setGenerationStatus('completed');
          isProcessingPoll.current = false;
          return;
        }
        
        if (order.status === 'failed') {
          setGenerationStatus('failed');
          isProcessingPoll.current = false;
          return;
        }
        
        if (order.status === 'generating') {
          const result = await triggerGeneration(id);
          if (result === 'completed') {
            isProcessingPoll.current = false;
            return;
          }
        } else if (order.status === 'training') {
          setGenerationStatus('training');
        }
      } catch (err) {
        console.error("Polling check failed:", err);
      } finally {
        isProcessingPoll.current = false;
        pollRef.current = setTimeout(pollFunc, 5000);
      }
    };

    pollRef.current = setTimeout(pollFunc, 5000);
  }, [fetchOrderById, fetchHeadshots, triggerGeneration]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        if (data) setOrders(data as Order[]);
      }
      
      if (orderId) {
        const order = await fetchOrderById(orderId);
        if (order) {
          setCurrentOrder(order);
          await fetchHeadshots(orderId);
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
      if (pollRef.current) clearTimeout(pollRef.current);
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

  const downloadSelected = async () => {
    setDownloading(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      const fetchImage = async (url: string, index: number) => {
        const res = await fetch(url);
        const blob = await res.blob();
        return { index, blob };
      };
      
      const results = await Promise.all(
        selectedImages.map((url, idx) => fetchImage(url, idx))
      );
      
      for (const item of results) {
        zip.file(`headshot_${item.index + 1}.jpg`, item.blob);
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `truzot-selected-${orderId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Batch download failed:", e);
    } finally {
      setDownloading(false);
      setSelectedImages([]);
    }
  };

  // Helper dynamically assigns categories to mimic HeadshotPro's tags flawlessly
  const getStyleCategory = (h: Headshot, index: number) => {
    if (h.category) return h.category;
    if (h.style) {
      const lower = h.style.toLowerCase();
      if (lower.includes('corporate') || lower.includes('linkedin')) return 'corporate';
      if (lower.includes('casual')) return 'casual';
      if (lower.includes('creative')) return 'creative';
    }
    const categories = ['corporate', 'casual', 'creative', 'studio', 'outdoor'];
    return categories[index % categories.length];
  };

  const getFilteredHeadshots = () => {
    if (activeCategory === 'all') return headshots;
    if (activeCategory === 'favorites') {
      return headshots.filter((h) => favorites.includes(h.image_url));
    }
    return headshots.filter((h, index) => getStyleCategory(h, index) === activeCategory);
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'generating':
      case 'training': return <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />;
      default: return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'failed': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'generating':
      case 'training': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      default: return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'completed': return 'Generated';
      case 'failed': return 'Failed';
      case 'generating': return 'Generating';
      case 'training': return 'AI Learning Mode';
      case 'paid': return 'Pending Training';
      default: return 'Awaiting Payment';
    }
  };

  const getPlanInfo = (planId: string) => {
    return PLANS[planId as keyof typeof PLANS] || { name: planId, shots: 0 };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        <span className="text-sm font-semibold text-slate-500">Loading your profile sandbox...</span>
      </div>
    );
  }

  const currentFiltered = getFilteredHeadshots();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* HeadshotPro Header style */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
            TRUZOT <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full ml-1">DASHBOARD</span>
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="text-xs text-slate-500 hidden sm:inline">{user.email}</span>
                <button
                  onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 transition"
                >
                  Log Out
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {orderId && currentOrder ? (
          <div>
            {/* Project Title Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-xs font-bold text-slate-400 hover:text-indigo-600 mb-2 block transition"
                >
                  ← Back to project library
                </button>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-slate-900">
                    {getPlanInfo(currentOrder.plan).name}
                  </h1>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(currentOrder.status)}`}>
                    {getStatusIcon(currentOrder.status)}
                    {getStatusText(currentOrder.status)}
                  </span>
                </div>
              </div>
              
              {currentOrder.status === 'completed' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMultiSelectMode(!multiSelectMode)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition border ${
                      multiSelectMode 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {multiSelectMode ? 'Cancel Multi-Select' : 'Select Multiple'}
                  </button>
                  <button
                    onClick={downloadAll}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    {downloading ? 'Compiling ZIP...' : 'Download All (.ZIP)'}
                  </button>
                </div>
              )}
            </div>

            {/* TRAINING STATE */}
            {currentOrder.status === 'training' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-3xl mx-auto shadow-sm">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Training your personal AI weights</h2>
                <p className="text-sm text-slate-500 max-w-lg mx-auto mb-6">
                  Our neural network is mapping your distinct bone coordinates and facial parameters. This usually takes 10 to 30 minutes. We'll send an email confirmation to <strong>{currentOrder.email}</strong> once completed.
                </p>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left max-w-md mx-auto mb-6">
                  <span className="text-[10px] font-bold tracking-wider text-indigo-600 block uppercase mb-1">Current Active Process</span>
                  <p className="text-xs font-semibold text-slate-700 animate-pulse">{TRAINING_STEPS[logIndex]}</p>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden max-w-md mx-auto">
                  <div className="h-full bg-indigo-600 rounded-full animate-pulse" style={{ width: '45%' }} />
                </div>
              </div>
            )}

            {/* GENERATING STATE */}
            {currentOrder.status === 'generating' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-3xl mx-auto shadow-sm">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Rendering your custom headshots</h2>
                  <p className="text-sm text-slate-500">
                    Applying chosen backdrops, suit prompts, and dynamic lightning configurations...
                  </p>
                </div>
                
                <div className="max-w-md mx-auto">
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                    <span>Rendering progress</span>
                    <span className="text-indigo-600">{generationProgress.count} / {generationProgress.target}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${generationProgress.target > 0 ? (generationProgress.count / generationProgress.target) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 text-center">
                    Generating in sequential segments. This dashboard will auto-refresh.
                  </p>
                </div>
              </div>
            )}

            {/* COMPLETED STATE - Visual playground */}
            {currentOrder.status === 'completed' && (
              <div>
                {/* Category filters exactly matching HeadshotPro */}
                <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-4 mb-6">
                  {[
                    { id: 'all', name: 'All Headshots' },
                    { id: 'favorites', name: '❤️ Favorites' },
                    { id: 'corporate', name: '💼 Corporate' },
                    { id: 'casual', name: '😊 Casual' },
                    { id: 'creative', name: '🎨 Creative' },
                    { id: 'studio', name: '📸 Studio' },
                    { id: 'outdoor', name: '🌳 Outdoor' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveCategory(tab.id);
                        setSelectedImages([]);
                      }}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                        activeCategory === tab.id 
                          ? 'bg-slate-900 text-white shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>

                {/* Grid */}
                {currentFiltered.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {currentFiltered.map((h, idx) => {
                      const isFav = favorites.includes(h.image_url);
                      const isSel = selectedImages.includes(h.image_url);
                      return (
                        <div 
                          key={h.id} 
                          className={`group relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-200 transition duration-300 shadow-sm border-2 ${
                            isSel ? 'border-indigo-600 ring-2 ring-indigo-50' : 'border-transparent'
                          }`}
                        >
                          <img
                            src={h.image_url}
                            alt="Custom headshot rendering"
                            className="w-full h-full object-cover select-none"
                            onDoubleClick={() => toggleSelectImage(h.image_url)}
                          />
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-slate-950/0 to-slate-950/20 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col justify-between p-3">
                            <div className="flex items-center justify-between">
                              {/* Left upper checkbox */}
                              {multiSelectMode ? (
                                <button 
                                  onClick={(e) => toggleSelectImage(h.image_url, e)}
                                  className="w-6 h-6 bg-white rounded-md flex items-center justify-center shadow-sm text-indigo-600"
                                >
                                  {isSel ? <CheckSquare className="w-5 h-5 fill-indigo-500 text-white" /> : <Square className="w-5 h-5 text-slate-400" />}
                                </button>
                              ) : (
                                <button 
                                  onClick={(e) => toggleSelectImage(h.image_url, e)}
                                  className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-white/40"
                                >
                                  {isSel ? <CheckSquare className="w-5 h-5 fill-indigo-500 text-white" /> : <Square className="w-5 h-5" />}
                                </button>
                              )}

                              {/* Right upper Heart */}
                              <button
                                onClick={(e) => toggleFavorite(h.image_url, e)}
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                                  isFav ? 'bg-rose-500 text-white' : 'bg-white/20 text-white hover:bg-white/40'
                                }`}
                              >
                                <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-white' : ''}`} />
                              </button>
                            </div>

                            {/* Bottom bar of single card */}
                            <div className="flex items-center justify-between gap-2">
                              <button
                                onClick={() => setSelected(h.image_url)}
                                className="bg-white text-slate-900 p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-100 transition"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => downloadSingle(h.image_url)}
                                className="bg-white text-slate-900 p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-100 transition"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Persistent favorites heart sign for clear sight */}
                          {isFav && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm group-hover:opacity-0 transition pointer-events-none">
                              <Heart className="w-3 h-3 fill-white" />
                            </div>
                          )}
                          {isSel && (
                            <div className="absolute top-2 left-2 w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center shadow-sm group-hover:opacity-0 transition pointer-events-none">
                              <CheckSquare className="w-4 h-4 fill-indigo-500 text-white" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                    <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-700">No headshots in this filter</h4>
                    <p className="text-xs text-slate-400">Try toggling other categories or adding some favorites.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Dashboard Library (When user is loaded but no individual project ID is active) */
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Your Headshot Shoots</h1>
                <p className="text-xs text-slate-500">Manage and access all previous rendering orders</p>
              </div>
              <Link href="/upload" className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
                <Plus className="w-4 h-4" />
                New Shoot
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Create your first AI models</h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                  Get high-end studio pictures in under an hour without setting foot outside.
                </p>
                <Link href="/upload" className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-indigo-700 transition">
                  Upload Selfies <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map((o) => (
                  <Link 
                    key={o.id} 
                    href={`/dashboard?order=${o.id}`} 
                    className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition group block"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase block mb-1">
                          {getPlanInfo(o.plan).name}
                        </span>
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition">
                          Shoot #{o.id.slice(0, 8)}
                        </h3>
                        <span className="text-xs text-slate-400 block mt-1">
                          Ordered {new Date(o.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(o.status)}`}>
                        {getStatusText(o.status)}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                      Explore render sheets <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Bottom Selection Actions (Matches HeadshotPro's multi select panel) */}
      {multiSelectMode && selectedImages.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-xl z-50 flex items-center gap-6 border border-slate-800 animate-slide-up">
          <div className="text-xs font-bold">
            <span className="text-indigo-400">{selectedImages.length}</span> images selected
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-700 transition"
            >
              Select Page
            </button>
            <button
              onClick={downloadSelected}
              className="inline-flex items-center gap-1 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download Selected
            </button>
            <button
              onClick={() => setSelectedImages([])}
              className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-700 transition"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL WITH FULL CONTROLS */}
      {selected && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <img src={selected} alt="Zoomed headshot preview" className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl" />
          
          {/* Top panel actions */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Zoom Preview Mode</span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleFavorite(selected)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                  favorites.includes(selected) ? 'bg-rose-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${favorites.includes(selected) ? 'fill-white' : ''}`} />
              </button>
              <button
                onClick={() => downloadSingle(selected)}
                className="w-9 h-9 rounded-full bg-white text-slate-900 flex items-center justify-center hover:bg-slate-100 transition"
              >
                <Download className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setSelected(null)} 
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg font-bold"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return <Suspense><DashboardContent /></Suspense>;
}
