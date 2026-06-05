"use client";
import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { PLANS } from "@/lib/plans";
import type { User, Order, Headshot } from "@/lib/types";
import { Camera } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileDrawer from "@/components/dashboard/MobileDrawer";
import ProjectLibrary from "@/components/dashboard/ProjectLibrary";
import TrainingView from "@/components/dashboard/TrainingView";
import GeneratingView from "@/components/dashboard/GeneratingView";
import FailedView from "@/components/dashboard/FailedView";
import CompletedGallery from "@/components/dashboard/CompletedGallery";
import LightboxModal from "@/components/dashboard/LightboxModal";
import FloatingSelectionBar from "@/components/dashboard/FloatingSelectionBar";
import DownloadProgress from "@/components/DownloadProgress";
import GalleryErrorBoundary from "@/components/GalleryErrorBoundary";
import { useToast } from "@/components/Toast";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = searchParams.get("order");

  const [headshots, setHeadshots] = useState<Headshot[]>([]);
  const [headshotPage, setHeadshotPage] = useState<number>(0);
  const [hasMoreHeadshots, setHasMoreHeadshots] = useState<boolean>(true);
  const [loadingHeadshots, setLoadingHeadshots] = useState<boolean>(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [generationProgress, setGenerationProgress] = useState({
    count: 0,
    target: 0,
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== "undefined" && orderId) {
      try {
        return JSON.parse(
          localStorage.getItem(`truzot-favs-${orderId}`) || "[]",
        );
      } catch {
        return [];
      }
    }
    return [];
  });
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const subsRef = useRef<RealtimeChannel | null>(null);

  const toggleFavorite = (url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = favorites.includes(url)
      ? favorites.filter((item) => item !== url)
      : [...favorites, url];
    setFavorites(updated);
    if (orderId)
      localStorage.setItem(`truzot-favs-${orderId}`, JSON.stringify(updated));
  };

  const toggleSelectImage = (url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedImages(
      selectedImages.includes(url)
        ? selectedImages.filter((item) => item !== url)
        : [...selectedImages, url],
    );
  };

  const toggleSelectAll = () => {
    const currentList = getFilteredHeadshots().map((h) => h.image_url);
    const allSelected = currentList.every((url) =>
      selectedImages.includes(url),
    );
    setSelectedImages(
      allSelected
        ? selectedImages.filter((url) => !currentList.includes(url))
        : Array.from(new Set([...selectedImages, ...currentList])),
    );
  };

  const fetchOrderById = useCallback(async (id: string) => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();
    return data as Order;
  }, []);

  const PAGE_SIZE = 40;

  const fetchHeadshots = useCallback(async (id: string, page = 0) => {
    setLoadingHeadshots(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count } = await supabase
      .from("headshots")
      .select("id, image_url, style, category", { count: "exact" })
      .eq("order_id", id)
      .order("created_at", { ascending: true })
      .range(from, to);
    if (data) {
      setHeadshots(
        (prev) => (page === 0 ? data : [...prev, ...data]) as Headshot[],
      );
      setHasMoreHeadshots((count ?? 0) > from + PAGE_SIZE);
    }
    setHeadshotPage(page);
    setLoadingHeadshots(false);
  }, []);

  const loadMoreHeadshots = useCallback(() => {
    if (orderId && hasMoreHeadshots && !loadingHeadshots)
      fetchHeadshots(orderId, headshotPage + 1);
  }, [
    orderId,
    hasMoreHeadshots,
    loadingHeadshots,
    headshotPage,
    fetchHeadshots,
  ]);

  const checkOrderStatus = useCallback(
    async (id: string) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch(`/api/order-status?orderId=${id}`, {
          headers: { Authorization: `Bearer ${session?.access_token || ""}` },
        });
        const data = await res.json();
        if (data.status === "completed") {
          if (data.headshots?.length > 0) {
            setHeadshots(data.headshots as Headshot[]);
            setHasMoreHeadshots(false);
          } else {
            setHeadshots([]);
            setHeadshotPage(0);
            setHasMoreHeadshots(true);
            await fetchHeadshots(id, 0);
          }
        }
        if (data.status === "generating") {
          setGenerationProgress({
            count: data.count || 0,
            target: data.target || 0,
          });
        }
        return data.status;
      } catch {
        return "error";
      }
    },
    [fetchHeadshots],
  );

  const subscribeToOrder = useCallback(
    (id: string) => {
      const channel = supabase
        .channel(`order-${id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `id=eq.${id}`,
          },
          (payload) => {
            const updated = payload.new as Order;
            setCurrentOrder(updated);
            if (updated.status === "completed") {
              setHeadshots([]);
              setHeadshotPage(0);
              setHasMoreHeadshots(true);
              fetchHeadshots(id, 0);
            }
            if (updated.status === "generating") {
              checkOrderStatus(id);
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "headshots",
            filter: `order_id=eq.${id}`,
          },
          () => {
            checkOrderStatus(id);
          },
        )
        .subscribe();
      return channel;
    },
    [fetchHeadshots, checkOrderStatus],
  );

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        subsRef.current?.unsubscribe();
        subsRef.current = null;
      }
    });
    return () => authListener?.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const u = session.user;
        setUser({
          id: u.id,
          email: u.email,
          user_metadata: u.user_metadata as User["user_metadata"],
        });
        const { data } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", u.id)
          .order("created_at", { ascending: false });
        if (data) setOrders(data as Order[]);
      }
      if (orderId) {
        const order = await fetchOrderById(orderId);
        if (order) {
          setCurrentOrder(order);
          setHeadshots([]);
          setHeadshotPage(0);
          setHasMoreHeadshots(true);
          await fetchHeadshots(orderId, 0);
          if (["training", "generating"].includes(order.status)) {
            const channel = subscribeToOrder(orderId);
            subsRef.current = channel;
          }
        }
      }
      setAuthChecked(true);
      setLoading(false);
    };
    checkAuth();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) {
        const u = session.user;
        setUser({
          id: u.id,
          email: u.email,
          user_metadata: u.user_metadata as User["user_metadata"],
        });
      }
    });
    return () => {
      subscription.unsubscribe();
      if (subsRef.current) supabase.removeChannel(subsRef.current);
    };
  }, [router, orderId, fetchOrderById, fetchHeadshots, subscribeToOrder]);

  const getStyleCategory = (h: Headshot, index: number) => {
    if (h.category) return h.category;
    const lower = (h.style || "").toLowerCase();
    if (lower.includes("corporate") || lower.includes("linkedin"))
      return "corporate";
    if (lower.includes("casual")) return "casual";
    if (lower.includes("creative")) return "creative";
    const cats = ["corporate", "casual", "creative", "studio", "outdoor"];
    return cats[index % cats.length];
  };

  const getFilteredHeadshots = () => {
    if (activeCategory === "all") return headshots;
    if (activeCategory === "favorites")
      return headshots.filter((h) => favorites.includes(h.image_url));
    return headshots.filter(
      (h, index) => getStyleCategory(h, index) === activeCategory,
    );
  };

  const downloadSingle = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "headshot.jpg";
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // silent fail
    }
  };

  const downloadSelected = async () => {
    if (selectedImages.length === 0 || !orderId) return;
    setDownloading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ imageUrls: selectedImages, orderId }),
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `truzot-selected-${selectedImages.length}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast("Failed to download selected images. Please try again.", "error");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          <div className="skeleton h-10 w-64 mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-48 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (authChecked && !user && !orderId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <Camera className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          Sign in to view your projects
        </h2>
        <p className="text-slate-500 mb-8 text-center max-w-md">
          You need to be signed in to see your headshot projects and downloads.
        </p>
        <Link
          href="/login"
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const currentFiltered = getFilteredHeadshots();

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar user={user} active={!orderId} />

      <main className="flex-1 overflow-y-auto relative">
        <div className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <Link
            href="/"
            className="text-lg font-black tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
          >
            TRUZOT
          </Link>
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="text-xs font-bold text-slate-500 p-2"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        <MobileDrawer
          open={mobileDrawerOpen}
          user={user}
          onClose={() => setMobileDrawerOpen(false)}
        />

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {orderId && currentOrder ? (
            <div className="animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="text-xs font-bold text-slate-400 hover:text-blue-600 mb-2 flex items-center gap-1 transition"
                  >
                    ← Back to library
                  </button>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-black text-slate-900">
                      {PLANS[currentOrder.plan as keyof typeof PLANS]?.name ||
                        "Shoot"}
                    </h1>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider">
                      {currentOrder.status}
                    </span>
                  </div>
                </div>

                {currentOrder.status === "completed" && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setMultiSelectMode(!multiSelectMode)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition border ${multiSelectMode ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                    >
                      {multiSelectMode ? "Cancel Select" : "Select Multiple"}
                    </button>
                    <DownloadProgress
                      onDownload={async (onProgress) => {
                        const {
                          data: { session },
                        } = await supabase.auth.getSession();
                        let downloadToken = "";
                        if (session?.access_token) {
                          const tokRes = await fetch("/api/download/token", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${session.access_token}`,
                            },
                            body: JSON.stringify({ orderId }),
                          });
                          if (tokRes.ok) {
                            const tokData = await tokRes.json();
                            downloadToken = tokData.token;
                          }
                        }
                        const res = await fetch(
                          `/api/download?orderId=${orderId}&download_token=${encodeURIComponent(downloadToken)}`,
                        );
                        if (!res.ok) throw new Error("Download failed");
                        const reader = res.body?.getReader();
                        if (!reader) return;
                        const contentLength = +(
                          res.headers.get("Content-Length") || "0"
                        );
                        let received = 0;
                        const chunks: Uint8Array[] = [];
                        while (true) {
                          const { done, value } = await reader.read();
                          if (done) break;
                          chunks.push(value);
                          received += value.length;
                          if (contentLength)
                            onProgress(received, contentLength);
                        }
                        const totalLength = chunks.reduce(
                          (s, c) => s + c.length,
                          0,
                        );
                        const merged = new Uint8Array(totalLength);
                        let offset = 0;
                        for (const c of chunks) {
                          merged.set(c, offset);
                          offset += c.length;
                        }
                        const blob = new Blob([merged]);
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `truzot-headshots-${orderId}.zip`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      label="Download All"
                    />
                  </div>
                )}
              </div>

              {currentOrder.status === "training" && (
                <TrainingView order={currentOrder} />
              )}
              {currentOrder.status === "generating" && (
                <GeneratingView
                  count={generationProgress.count}
                  target={generationProgress.target}
                />
              )}
              {currentOrder.status === "failed" && (
                <FailedView order={currentOrder} />
              )}

              {currentOrder.status === "completed" && (
                <GalleryErrorBoundary>
                  <CompletedGallery
                    headshots={headshots}
                    filtered={currentFiltered}
                    activeCategory={activeCategory}
                    orderId={orderId!}
                    favorites={favorites}
                    selectedImages={selectedImages}
                    multiSelectMode={multiSelectMode}
                    hasMore={hasMoreHeadshots}
                    loadingMore={loadingHeadshots}
                    onLoadMore={loadMoreHeadshots}
                    onCategoryChange={(cat) => {
                      setActiveCategory(cat);
                      setSelectedImages([]);
                    }}
                    onToggleSelect={toggleSelectImage}
                    onToggleFavorite={toggleFavorite}
                    onView={(url) => setSelected(url)}
                    onDownload={downloadSingle}
                    onFlag={async (url) => {
                      const {
                        data: { session },
                      } = await supabase.auth.getSession();
                      const res = await fetch("/api/feedback", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${session?.access_token || ""}`,
                        },
                        body: JSON.stringify({ orderId, imageUrl: url }),
                      });
                      if (res.ok)
                        toast("Headshot flagged for review", "success");
                      else toast("Failed to flag headshot", "error");
                    }}
                  />
                </GalleryErrorBoundary>
              )}
            </div>
          ) : (
            <ProjectLibrary orders={orders} />
          )}
        </div>
      </main>

      {multiSelectMode && selectedImages.length > 0 && (
        <FloatingSelectionBar
          selectedCount={selectedImages.length}
          downloading={downloading}
          onSelectAll={toggleSelectAll}
          onDownload={downloadSelected}
          onClear={() => setSelectedImages([])}
        />
      )}

      {selected &&
        (() => {
          const all = currentFiltered.map((h) => h.image_url);
          const idx = all.indexOf(selected);
          return (
            <LightboxModal
              imageUrl={selected}
              allImages={all}
              favorites={favorites}
              onClose={() => setSelected(null)}
              onPrev={idx > 0 ? () => setSelected(all[idx - 1]) : undefined}
              onNext={
                idx >= 0 && idx < all.length - 1
                  ? () => setSelected(all[idx + 1])
                  : undefined
              }
              onToggleFavorite={toggleFavorite}
              onDownload={downloadSingle}
            />
          );
        })()}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
          <div className="skeleton h-10 w-64 mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-48 rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
