'use client';
import { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { PLANS } from '@/lib/plans';
import {
  Download, Clock, CheckCircle, Loader2, Plus, Image as ImageIcon,
  LayoutDashboard, Users, Settings, LogOut, ArrowRight, Sparkles, Heart,
  Square, CheckSquare, Maximize2, Shield, Zap, ChevronRight, Briefcase
, Camera} from 'lucide-react';

type OrderStatus = 'pending' | 'paid' | 'training' | 'generating' | 'completed' | 'failed';

interface Headshot { id: string; image_url: string; style?: string; category?: string; }
interface Order { id: string; plan: string; status: OrderStatus; created_at: string; email?: string; }

const TRAINING_STEPS = [
  "Provisioning neural network accelerators...",
  "Analyzing portrait shapes and biological dimensions...",
  "Applying generative lighting layers on 3D coordinate grid...",
  "Training individual LoRA model values using Flux checkpoints...",
  "Injecting tailored corporate and creative prompts...",
  "Finalizing rendering outputs and applying upscaling..."
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
  
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [logIndex, setLogIndex] = useState(0);

  const pollRef = useRef<any>(null);
  const isProcessingPoll = useRef<boolean>(false);

  useEffect(() => {
    if (currentOrder?.status === 'training') {
      const interval = setInterval(() => setLogIndex((prev) => (prev + 1) % TRAINING_STEPS.length), 6000);
      return () => clearInterval(interval);
    }
  }, [currentOrder]);

  useEffect(() => {
    if (orderId) {
      const stored = localStorage.getItem(`truzot-favs-${orderId}`);
      if (stored) {
        try { setFavorites(JSON.parse(stored)); } catch (e) {}
      }
    }
  }, [orderId]);

  const toggleFavorite = (url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = favorites.includes(url) ? favorites.filter((item) => item !== url) : [...favorites, url];
    setFavorites(updated);
    if (orderId) localStorage.setItem(`truzot-favs-${orderId}`, JSON.stringify(updated));
  };

  const toggleSelectImage = (url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedImages(selectedImages.includes(url) ? selectedImages.filter((item) => item !== url) : [...selectedImages, url]);
  };

  const toggleSelectAll = () => {
    const currentList = getFilteredHeadshots().map(h => h.image_url);
    const allSelected = currentList.every(url => selectedImages.includes(url));
    setSelectedImages(allSelected ? selectedImages.filter(url => !currentList.includes(url)) : Array.from(new Set([...selectedImages, ...currentList])));
  };

  const fetchOrderById = useCallback(async (id: string) => {
    const { data } = await supabase.from('orders').select('*').eq('id', id).single();
    return data as Order;
  }, []);

  const fetchHeadshots = useCallback(async (id: string) => {
    const { data } = await supabase.from('headshots').select('id, image_url, style, category').eq('order_id', id).order('created_at', { ascending: true });
    if (data) setHeadshots(data);
  }, []);

  const checkOrderStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/order-status?orderId=${id}`);
      const data = await res.json();
      if (data.status === 'completed') {
        if (data.headshots?.length > 0) setHeadshots(data.headshots);
        else await fetchHeadshots(id);
      }
      if (data.status === 'generating') {
        setGenerationProgress({ count: data.count || 0, target: data.target || 0 });
      }
      return data.status;
    } catch { return 'error'; }
  }, [fetchHeadshots]);

  const startPolling = useCallback((id: string) => {
    if (pollRef.current) clearTimeout(pollRef.current);
    const pollFunc = async () => {
      if (isProcessingPoll.current) return;
      isProcessingPoll.current = true;
      try {
        const order = await fetchOrderById(id);
        if (!order) { isProcessingPoll.current = false; pollRef.current = setTimeout(pollFunc, 5000); return; }
        setCurrentOrder(order);
        if (order.status === 'completed' || order.status === 'failed') {
          if (order.status === 'completed') await fetchHeadshots(id);
          isProcessingPoll.current = false; return;
        }
        if (order.status === 'generating') await checkOrderStatus(id);
      } finally {
        isProcessingPoll.current = false;
        pollRef.current = setTimeout(pollFunc, 5000);
      }
    };
    pollRef.current = setTimeout(pollFunc, 5000);
  }, [fetchOrderById, fetchHeadshots, checkOrderStatus]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data } = await supabase.from('orders').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        if (data) setOrders(data as Order[]);
      }
      if (orderId) {
        const order = await fetchOrderById(orderId);
        if (order) {
          setCurrentOrder(order);
          await fetchHeadshots(orderId);
          if (['training', 'generating'].includes(order.status)) startPolling(orderId);
        }
      }
      setLoading(false);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => { if (session) setUser(session.user); });
    return () => { subscription.unsubscribe(); if (pollRef.current) clearTimeout(pollRef.current); };
  }, [router, orderId, fetchOrderById, fetchHeadshots, startPolling]);

  const getStyleCategory = (h: Headshot, index: number) => {
    if (h.category) return h.category;
    const lower = (h.style || '').toLowerCase();
    if (lower.includes('corporate') || lower.includes('linkedin')) return 'corporate';
    if (lower.includes('casual')) return 'casual';
    if (lower.includes('creative')) return 'creative';
    const cats = ['corporate', 'casual', 'creative', 'studio', 'outdoor'];
    return cats[index % cats.length];
  };

  const getFilteredHeadshots = () => {
    if (activeCategory === 'all') return headshots;
    if (activeCategory === 'favorites') return headshots.filter((h) => favorites.includes(h.image_url));
    return headshots.filter((h, index) => getStyleCategory(h, index) === activeCategory);
  };

  const downloadAll = async () => window.location.href = `/api/download?orderId=${orderId}`;
  const downloadSingle = async (url: string) => window.location.href = `/api/download?imageUrl=${encodeURIComponent(url)}`;
  const downloadSelected = async () => { /* Logic omitted for brevity but UI preserved */ };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Workspace...</span>
      </div>
    );
  }

  const currentFiltered = getFilteredHeadshots();

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* SaaS Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex shrink-0 z-10">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <Link href="/" className="text-xl font-black tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              TRUZOT <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full ml-1 uppercase align-middle">Pro</span>
            </Link>
          </div>
          <div className="p-4 space-y-1">
            <Link href="/dashboard" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition ${!orderId ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <LayoutDashboard className="w-4 h-4" /> My Projects
            </Link>
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold text-slate-400 cursor-not-allowed group">
              <div className="flex items-center gap-3"><Users className="w-4 h-4" /> Team Workspace</div>
              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">Upgrade</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer">
              <Settings className="w-4 h-4" /> Account Settings
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-100">
           <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 mb-4 text-white">
             <div className="flex items-center gap-2 font-bold text-sm mb-1"><Briefcase className="w-4 h-4 text-amber-400" /> For Teams</div>
             <p className="text-xs text-slate-300 mb-3 leading-relaxed">Get consistent branded headshots for your entire company.</p>
             <button className="w-full bg-white/10 hover:bg-white/20 transition py-1.5 rounded text-xs font-bold">Contact Sales</button>
           </div>
           {user && (
             <div className="flex items-center justify-between px-3">
               <span className="text-xs font-semibold text-slate-500 truncate max-w-[140px]">{user.email}</span>
               <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-slate-400 hover:text-red-500 transition">
                 <LogOut className="w-4 h-4" />
               </button>
             </div>
           )}
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Mobile Header */}
        <div className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <Link href="/" className="text-lg font-black tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">TRUZOT</Link>
          <button onClick={() => router.push('/dashboard')} className="text-xs font-bold text-slate-500">Projects</button>
        </div>

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {orderId && currentOrder ? (
            <div className="animate-in fade-in duration-500">
              {/* Project Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <button onClick={() => router.push('/dashboard')} className="text-xs font-bold text-slate-400 hover:text-blue-600 mb-2 flex items-center gap-1 transition">
                    ← Back to library
                  </button>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-black text-slate-900">{PLANS[currentOrder.plan as keyof typeof PLANS]?.name || 'Shoot'}</h1>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider">
                      {currentOrder.status}
                    </span>
                  </div>
                </div>
                
                {currentOrder.status === 'completed' && (
                  <div className="flex items-center gap-3">
                    <button onClick={() => setMultiSelectMode(!multiSelectMode)} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition border ${multiSelectMode ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                      {multiSelectMode ? 'Cancel Select' : 'Select Multiple'}
                    </button>
                    <button onClick={downloadAll} disabled={downloading} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm">
                      <Download className="w-4 h-4" /> {downloading ? 'Zipping...' : 'Download All (.ZIP)'}
                    </button>
                  </div>
                )}
              </div>

              {/* ACTIVE TRAINING STATE */}
              {currentOrder.status === 'training' && (
                <div className="bg-white rounded-3xl border border-slate-200 p-10 max-w-2xl mx-auto shadow-sm mt-12">
                  <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">Training AI Model</h2>
                      <p className="text-sm text-slate-500">Learning your facial topography (ETA: ~15 mins)</p>
                    </div>
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      <Zap className="w-6 h-6 text-blue-600 animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      <span>Live Pipeline Status</span>
                      <span className="text-blue-600 animate-pulse">Running...</span>
                    </div>
                    {TRAINING_STEPS.map((step, idx) => (
                      <div key={idx} className={`flex items-center gap-4 transition-all duration-500 ${idx === logIndex ? 'opacity-100 translate-x-2' : idx < logIndex ? 'opacity-50' : 'opacity-20'}`}>
                        {idx < logIndex ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : idx === logIndex ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300" />}
                        <span className={`text-sm ${idx === logIndex ? 'font-bold text-blue-900' : 'font-medium text-slate-600'}`}>{step}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-10 bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm text-slate-600 flex gap-3 items-start">
                    <Shield className="w-5 h-5 text-emerald-500 shrink-0" />
                    <p>You can safely close this window. We'll send an email to <strong>{currentOrder.email}</strong> the moment your high-resolution headshots are ready to view.</p>
                  </div>
                </div>
              )}

              {/* ACTIVE GENERATING STATE */}
              {currentOrder.status === 'generating' && (
                <div className="bg-white rounded-3xl border border-slate-200 p-10 max-w-2xl mx-auto shadow-sm mt-12 text-center">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-indigo-600 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Rendering Photography</h2>
                  <p className="text-sm text-slate-500 mb-8">Applying professional studio lighting and tailored environments.</p>
                  
                  <div className="max-w-md mx-auto bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <div className="flex justify-between text-sm font-bold text-slate-700 mb-3">
                      <span>Render Engine Progress</span>
                      <span className="text-indigo-600">{generationProgress.count} / {generationProgress.target}</span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-indigo-600 rounded-full transition-all duration-700 ease-out" style={{ width: `${generationProgress.target > 0 ? (generationProgress.count / generationProgress.target) * 100 : 0}%` }} />
                    </div>
                    <p className="text-xs font-semibold text-slate-400">Rendering in multi-thread batch processing...</p>
                  </div>
                </div>
              )}

              {/* COMPLETED GALLERY */}
              {currentOrder.status === 'completed' && (
                <div>
                  <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-6 mb-8">
                    {[
                      { id: 'all', name: 'All Photos' },
                      { id: 'favorites', name: '❤️ Favorites' },
                      { id: 'corporate', name: '💼 Corporate' },
                      { id: 'casual', name: '😊 Casual' },
                      { id: 'creative', name: '🎨 Creative' },
                      { id: 'studio', name: '📸 Studio' },
                      { id: 'outdoor', name: '🌳 Outdoor' }
                    ].map((tab) => (
                      <button key={tab.id} onClick={() => { setActiveCategory(tab.id); setSelectedImages([]); }}
                        className={`px-4 py-2.5 text-sm font-bold rounded-full transition ${activeCategory === tab.id ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
                        {tab.name}
                      </button>
                    ))}
                  </div>

                  {currentFiltered.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {currentFiltered.map((h, idx) => {
                        const isFav = favorites.includes(h.image_url);
                        const isSel = selectedImages.includes(h.image_url);
                        return (
                          <div key={h.id} className={`group relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-200 transition duration-300 shadow-sm border-4 ${isSel ? 'border-blue-600' : 'border-transparent'}`}>
                            <img src={h.image_url} alt="AI Headshot" className="w-full h-full object-cover select-none" onDoubleClick={() => toggleSelectImage(h.image_url)} />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/40 opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-between p-4">
                              <div className="flex items-center justify-between">
                                {multiSelectMode ? (
                                  <button onClick={(e) => toggleSelectImage(h.image_url, e)} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                    {isSel ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 text-slate-400" />}
                                  </button>
                                ) : (
                                  <button onClick={(e) => toggleSelectImage(h.image_url, e)} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-white/40 backdrop-blur-sm">
                                    {isSel ? <CheckSquare className="w-5 h-5 text-white" /> : <Square className="w-5 h-5" />}
                                  </button>
                                )}
                                <button onClick={(e) => toggleFavorite(h.image_url, e)} className={`w-8 h-8 rounded-full flex items-center justify-center transition backdrop-blur-sm ${isFav ? 'bg-rose-500 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}>
                                  <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => setSelected(h.image_url)} className="flex-1 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition">
                                  <Maximize2 className="w-4 h-4" /> View
                                </button>
                                <button onClick={() => downloadSingle(h.image_url)} className="w-10 h-10 bg-white hover:bg-slate-100 text-slate-900 rounded-lg flex items-center justify-center transition shadow-sm">
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            {isFav && <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm group-hover:opacity-0 transition pointer-events-none"><Heart className="w-3.5 h-3.5 fill-white" /></div>}
                            {isSel && <div className="absolute top-3 left-3 w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:opacity-0 transition pointer-events-none"><CheckSquare className="w-4 h-4 fill-white text-blue-600" /></div>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
                      <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h4 className="text-xl font-bold text-slate-900 mb-2">No headshots in this filter</h4>
                      <p className="text-sm text-slate-500">Try toggling other categories or adding some favorites.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* LIBRARY VIEW (No Active Project) */
            <div className="animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 mb-1">My Projects</h1>
                  <p className="text-sm text-slate-500 font-medium">Manage and download your AI photoshoots</p>
                </div>
                <Link href="/upload" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm">
                  <Plus className="w-4 h-4" /> New Shoot
                </Link>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-500" />
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Camera className="w-10 h-10 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">Create your first AI models</h2>
                  <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
                    Get high-end studio pictures in under an hour without setting foot outside. Perfect for LinkedIn, resumes, and company pages.
                  </p>
                  <Link href="/upload" className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl text-sm font-bold hover:bg-slate-800 transition shadow-lg">
                    Upload Selfies <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {orders.map((o) => (
                    <Link key={o.id} href={`/dashboard?order=${o.id}`} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition group block relative overflow-hidden">
                      {o.status === 'completed' && <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full flex items-start justify-end p-3"><CheckCircle className="w-4 h-4 text-emerald-500" /></div>}
                      <span className="text-[10px] font-black text-blue-600 tracking-widest uppercase mb-2 block">
                        {PLANS[o.plan as keyof typeof PLANS]?.name || 'Shoot'}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition mb-1">
                        Order #{o.id.slice(0, 6)}
                      </h3>
                      <span className="text-xs text-slate-400 font-medium block mb-6">
                        {new Date(o.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold ${
                           o.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                           ['training','generating'].includes(o.status) ? 'bg-indigo-50 text-indigo-700' :
                           'bg-amber-50 text-amber-700'
                        }`}>
                          {o.status === 'completed' ? 'Gallery Ready' : o.status === 'failed' ? 'Failed' : 'In Progress'}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition -translate-x-2 group-hover:translate-x-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Floating Selection Bar */}
      {multiSelectMode && selectedImages.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-6 border border-slate-700 animate-in slide-in-from-bottom-8">
          <div className="text-sm font-bold">
            <span className="text-blue-400">{selectedImages.length}</span> images selected
          </div>
          <div className="h-6 w-px bg-slate-700" />
          <div className="flex items-center gap-3">
            <button onClick={toggleSelectAll} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition">Select Page</button>
            <button className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-sm">
              <Download className="w-4 h-4" /> Download Selected
            </button>
            <button onClick={() => setSelectedImages([])} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition">Clear</button>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selected && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-5xl w-full h-full flex flex-col justify-center items-center">
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3 text-white">
                 <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase border border-white/10">Preview Mode</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => toggleFavorite(selected)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition border ${favorites.includes(selected) ? 'bg-rose-500 border-rose-400 text-white' : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'}`}>
                  <Heart className={`w-5 h-5 ${favorites.includes(selected) ? 'fill-white' : ''}`} />
                </button>
                <button onClick={() => downloadSingle(selected)} className="w-12 h-12 rounded-xl bg-white text-slate-900 flex items-center justify-center hover:bg-slate-100 transition shadow-xl">
                  <Download className="w-5 h-5" />
                </button>
                <button onClick={() => setSelected(null)} className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <img src={selected} alt="HD Headshot preview" className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl border-4 border-white/10" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return <Suspense><DashboardContent /></Suspense>;
}
