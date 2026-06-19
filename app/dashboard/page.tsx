/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import {
  useEffect,
  useState,
  useCallback,
  Suspense,
  useRef,
  lazy,
  useMemo,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import JSZip from "jszip";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { PLANS } from "@/lib/plans";
import type { User, Order, Headshot } from "@/lib/types";
import { Camera, ChevronRight, Share2, Mail, Sparkles } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileDrawer from "@/components/dashboard/MobileDrawer";
import ProjectLibrary from "@/components/dashboard/ProjectLibrary";
import TrainingView from "@/components/dashboard/TrainingView";
import GeneratingView from "@/components/dashboard/GeneratingView";
import FailedView from "@/components/dashboard/FailedView";
import CompletedGallery from "@/components/dashboard/CompletedGallery";
import FloatingSelectionBar from "@/components/dashboard/FloatingSelectionBar";
import GalleryErrorBoundary from "@/components/GalleryErrorBoundary";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";
import { motion } from "framer-motion";

const LightboxModal = lazy(
  () => import("@/components/dashboard/LightboxModal"),
);
const DownloadProgress = lazy(() => import("@/components/DownloadProgress"));

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
  const [orderError, setOrderError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({
    current: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(true);
  const [fetchedOrder, setFetchedOrder] = useState<Order | null>(null);
  const currentOrder = useMemo(() => {
    if (!orderId) return null;
    return orders.find((o) => o.id === orderId) || fetchedOrder;
  }, [orderId, orders, fetchedOrder]);
  const [generationProgress, setGenerationProgress] = useState({
    count: 0,
    target: 0,
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const ordersRef = useRef<Order[]>([]);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // Reload favorites from localStorage when orderId changes (handles hydration and navigation)

  useEffect(() => {
    if (!orderId) return;
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(`truzot-favs-${orderId}`);
        setFavorites(stored ? JSON.parse(stored) : []);
      } catch {
        setFavorites([]);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [orderId]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmStyle: string;
    action: () => Promise<void>;
  } | null>(null);
  const subsRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string | null>(null);
  const initRef = useRef(false);

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

  const fetchOrderById = useCallback(
    async (id: string, downloadToken?: string) => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();
      if (data) return data as Order;
      // If RLS blocks (guest order or different owner), try via API
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const apiUrl = downloadToken
          ? `/api/order-status?orderId=${id}&download_token=${downloadToken}`
          : `/api/order-status?orderId=${id}`;
        const res = await fetch(apiUrl, {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        });
        const statusData = await res.json();
        if (statusData.status) {
          return {
            id,
            plan: statusData.plan || "unknown",
            status: statusData.status,
            created_at: new Date().toISOString(),
          } as Order;
        }
      } catch {}
      return null;
    },
    [],
  );

  const PAGE_SIZE = 40;

  const fetchHeadshots = useCallback(async (id: string, page = 0) => {
    setLoadingHeadshots(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count } = await supabase
      .from("headshots")
      .select("id, image_url, style, category", { count: "exact" })
      .eq("order_id", id)
      .order("created_at", { ascending: false })
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

  const fetchHeadshotsRef = useRef(fetchHeadshots);
  useEffect(() => {
    fetchHeadshotsRef.current = fetchHeadshots;
  }, [fetchHeadshots]);
  const checkOrderStatusRef = useRef(checkOrderStatus);
  useEffect(() => {
    checkOrderStatusRef.current = checkOrderStatus;
  }, [checkOrderStatus]);

  const headshotInsertTimerRef = useRef<NodeJS.Timeout | null>(null);
  const orderUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  const subscribeToOrder = useCallback((id: string) => {
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
          setFetchedOrder(updated);
          if (updated.status === "completed") {
            setHeadshots([]);
            setHeadshotPage(0);
            setHasMoreHeadshots(true);
            fetchHeadshotsRef.current(id, 0);
          }
          if (updated.status === "generating") {
            if (orderUpdateTimerRef.current) {
              clearTimeout(orderUpdateTimerRef.current);
            }
            orderUpdateTimerRef.current = setTimeout(() => {
              checkOrderStatusRef.current(id);
            }, 2000);
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
          // Debounce: batch rapid INSERT events into a single status check
          if (headshotInsertTimerRef.current) {
            clearTimeout(headshotInsertTimerRef.current);
          }
          headshotInsertTimerRef.current = setTimeout(() => {
            checkOrderStatusRef.current(id);
          }, 2000);
        },
      )
      .subscribe();
    return channel;
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          subsRef.current?.unsubscribe();
          subsRef.current = null;
          setUser(null);
          setOrders([]);
          userIdRef.current = null;
          return;
        }
        if (event === "SIGNED_IN" && session) {
          const u = session.user;
          setUser({
            id: u.id,
            email: u.email,
            user_metadata: u.user_metadata as User["user_metadata"],
          });
          userIdRef.current = u.id;
        }
      },
    );
    return () => authListener?.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadOrderDetail = async () => {
      setOrderError(null);
      const existingOrder = ordersRef.current.find((o) => o.id === orderId);

      if (orderId) {
        if (existingOrder) {
          setFetchedOrder(existingOrder);
          setOrderLoading(false);
        } else {
          setFetchedOrder(null);
          setOrderLoading(true);
        }
        setHeadshots([]);
        setHeadshotPage(0);
        setHasMoreHeadshots(true);
      } else {
        setFetchedOrder(null);
        setHeadshots([]);
        setHeadshotPage(0);
        setHasMoreHeadshots(true);
        setOrderLoading(false);
      }

      if (!initRef.current) {
        initRef.current = true;
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          const u = session.user;
          userIdRef.current = u.id;
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
          if (data) {
            setOrders(data as Order[]);
            if (orderId && !existingOrder) {
              const prefilled = (data as Order[]).find((o) => o.id === orderId);
              if (prefilled) {
                setFetchedOrder(prefilled);
                setOrderLoading(false);
              }
            }
          }
        }
      }
      if (!authChecked) setAuthChecked(true);
      if (subsRef.current) {
        supabase.removeChannel(subsRef.current);
        subsRef.current = null;
      }
      if (orderId) {
        const downloadToken =
          new URLSearchParams(window.location.search).get("download_token") ??
          undefined;
        const order = await fetchOrderById(orderId, downloadToken);
        if (order) {
          setOrderError(null);
          setFetchedOrder(order);
          if (order.status !== "pending") {
            await fetchHeadshots(orderId, 0);
          }
          const channel = subscribeToOrder(orderId);
          subsRef.current = channel;
          if (order.status === "generating") {
            checkOrderStatusRef.current(orderId);
          }
        } else {
          setOrderError(
            "Order not found. It may have been deleted or expired.",
          );
          setFetchedOrder(null);
          setHeadshots([]);
        }
      } else {
        setOrderError(null);
        setFetchedOrder(null);
        setHeadshots([]);
        setHeadshotPage(0);
        setHasMoreHeadshots(true);
      }
      setOrderLoading(false);
      setLoading(false);
    };
    loadOrderDetail();
    return () => {
      if (subsRef.current) supabase.removeChannel(subsRef.current);
    };
  }, [orderId, fetchOrderById, fetchHeadshots, subscribeToOrder]);

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

  const MAX_ZIP_IMAGES = 50;

  const serverSideDownload = async (
    urls: string[],
    filename: string,
    onProgress?: (current: number, total: number) => void,
  ) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (onProgress) onProgress(1, 1);

    // Use server-side ZIP endpoint to prevent mobile browser OOM crashes
    const res = await fetch("/api/download/zip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ imageUrls: urls, orderId }),
    });

    if (!res.ok) {
      toast("Download failed. Try again.", "error");
      return;
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  };

  const shareGallery = async () => {
    if (!orderId) return;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch("/api/download/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) {
        toast("Failed to create share link", "error");
        return;
      }
      const { token: dlToken } = await res.json();
      const shareUrl = `${window.location.origin}/dashboard?order=${orderId}&download_token=${dlToken}`;
      await navigator.clipboard.writeText(shareUrl);
      toast("Share link copied to clipboard!", "success");
    } catch {
      toast("Failed to copy share link", "error");
    }
  };

  const emailDelivery = async () => {
    const recipientEmail = user?.email || currentOrder?.email;
    if (!orderId || !recipientEmail) return;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/send-headshots", {
        method: "POST",
        headers,
        body: JSON.stringify({
          orderId,
          email: recipientEmail,
          imageUrls: headshots.map((h) => h.image_url),
        }),
      });
      if (res.ok) {
        toast("Headshots sent to your email!", "success");
      } else {
        toast("Failed to send headshots", "error");
      }
    } catch {
      toast("Failed to send headshots", "error");
    }
  };

  const downloadSingle = async (url: string) => {
    try {
      const proxyRes = await fetch(
        `/api/download/proxy?url=${encodeURIComponent(url)}`,
      );
      if (!proxyRes.ok) return;
      const blob = await proxyRes.blob();
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
    setDownloadProgress({ current: 0, total: selectedImages.length });
    try {
      await serverSideDownload(
        selectedImages,
        `truzot-selected-${selectedImages.length}.zip`,
        (current, total) => setDownloadProgress({ current, total }),
      );
    } catch {
      toast("Failed to download selected images. Please try again.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleRetryOrder = async (id: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch("/api/generate/retry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId: id }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "generating" } : o)),
      );
      toast("Retrying generation...", "success");
    } else {
      toast("Failed to retry generation", "error");
    }
  };

  const handleResumeCheckout = async (id: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    try {
      const res = await fetch("/api/checkout/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: id }),
      });
      if (res.ok) {
        const { url } = await res.json();
        if (url) window.location.href = url;
      } else {
        toast("Failed to resume checkout", "error");
      }
    } catch {
      toast("Failed to resume checkout", "error");
    }
  };

  const handleRegenerateHeadshot = async (imageUrl: string) => {
    if (!orderId) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      toast("Please sign in to regenerate", "error");
      return;
    }
    try {
      const res = await fetch("/api/regenerate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ orderId, imageUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.replacementUrl) {
          setHeadshots((prev) =>
            prev.map((h) =>
              h.image_url === imageUrl
                ? { ...h, image_url: data.replacementUrl }
                : h,
            ),
          );
          toast("Headshot regenerated!", "success");
        } else {
          toast(data.message || "Regeneration submitted", "success");
        }
      } else {
        toast("Failed to regenerate headshot", "error");
      }
    } catch {
      toast("Failed to regenerate headshot", "error");
    }
  };

  const handleCancelOrder = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Cancel Shoot",
      message:
        "Are you sure you want to stop processing this shoot? You will be refunded if applicable.",
      confirmText: "Cancel Shoot",
      confirmStyle: "bg-red-600 hover:bg-red-700",
      action: async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        try {
          const res = await fetch(`/api/orders/cancel?id=${id}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            setOrders((prev) =>
              prev.map((o) => (o.id === id ? { ...o, status: "failed" } : o)),
            );
            if (currentOrder && currentOrder.id === id) {
              setFetchedOrder((prev) =>
                prev ? { ...prev, status: "failed" } : prev,
              );
            }
            toast("Shoot cancelled successfully", "success");
          } else {
            const data = await res.json().catch(() => ({}));
            toast(data.error || "Failed to cancel shoot", "error");
          }
        } catch (err) {
          toast("Failed to cancel shoot", "error");
        }
      },
    });
  };

  const handleRenameOrder = async (id: string) => {
    const newName = prompt("Enter new shoot name:");
    if (!newName) return;
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, shoot_name: newName } : o)),
    );
    if (currentOrder && currentOrder.id === id) {
      setFetchedOrder((prev) =>
        prev ? { ...prev, shoot_name: newName } : prev,
      );
    }
    toast("Shoot renamed", "success");
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      await supabase.from("orders").update({ shoot_name: newName }).eq("id", id);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Shoot",
      message:
        "Are you sure you want to delete this shoot? This action cannot be undone.",
      confirmText: "Delete",
      confirmStyle: "bg-red-600 hover:bg-red-700",
      action: async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        try {
          const res = await fetch(`/api/orders?id=${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Requested-With": "XMLHttpRequest",
            },
          });
          if (res.ok) {
            setConfirmModal(null);
            setOrders((prev) => prev.filter((o) => o.id !== id));
            if (orderId === id) {
              setFetchedOrder(null);
              window.history.pushState(null, "", "/dashboard");
            }
            toast("Shoot deleted successfully", "success");
          } else {
            const data = await res.json().catch(() => ({}));
            toast(data.error || "Failed to delete shoot", "error");
          }
        } catch (err) {
          toast("Failed to delete shoot", "error");
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] p-6 md:p-10">
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
      <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col items-center justify-center px-6">
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
    <div className="flex h-screen bg-[var(--bg-primary)] font-sans text-[var(--text-primary)] overflow-hidden">
      <Sidebar user={user} active={!orderId} />

      <main className="flex-1 overflow-y-auto relative">
        <div className="md:hidden h-16 bg-[var(--bg-card)] border-b border-[var(--border-primary)] flex items-center justify-between px-6 sticky top-0 z-20">
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

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 md:p-10 max-w-7xl mx-auto"
        >
          {orderLoading && orderId && !currentOrder && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {orderError && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                <Camera className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Order Not Found
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
                {orderError}
              </p>
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
              >
                Back to Library
              </a>
            </div>
          )}
          {orderId && !orderError && currentOrder ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              key="detail-view"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <a
                    href="/dashboard"
                    className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-blue-600 mb-2 flex items-center gap-1 transition"
                  >
                    ← Back to library
                  </a>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                      {PLANS[currentOrder.plan as keyof typeof PLANS]?.name ||
                        "Shoot"}
                    </h1>
                    <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
                      {currentOrder.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
                    Created{" "}
                    {new Date(currentOrder.created_at).toLocaleDateString(
                      undefined,
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </p>
                </div>

                {currentOrder.status === "completed" && (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={shareGallery}
                      className="px-4 py-2.5 rounded-xl text-sm font-bold border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2"
                      title="Copy shareable gallery link"
                    >
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button
                      onClick={emailDelivery}
                      className="px-4 py-2.5 rounded-xl text-sm font-bold border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2"
                      title="Email my headshots"
                    >
                      <Mail className="w-4 h-4" /> Email
                    </button>
                    <button
                      onClick={() => {
                        const prefs =
                          (currentOrder.preferences as Record<string, any>) ||
                          {};
                        try {
                          sessionStorage.setItem(
                            "truzot-upload",
                            JSON.stringify({
                              step: 3,
                              plan: currentOrder.plan,
                              email: currentOrder.email || "",
                              consentChecked: true,
                              gender: prefs.gender || "",
                              eyeColor: prefs.eyeColor || "",
                              hairColor: prefs.hairColor || "",
                              clothing: prefs.clothing || "business-casual",
                              background: prefs.background || "studio",
                              framing: prefs.framing || "closeup",
                              selectedStyles: prefs.selectedStyles || [],
                              storagePath: prefs.storagePath || "",
                              filesCount: 0,
                              shootName: "",
                            }),
                          );
                        } catch {}
                        router.push("/upload");
                      }}
                      className="px-4 py-2.5 rounded-xl text-sm font-bold border bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition flex items-center gap-2"
                      title="Generate more headshots with new styles"
                    >
                      <Sparkles className="w-4 h-4" /> Generate More
                    </button>
                    <button
                      onClick={() => setMultiSelectMode(!multiSelectMode)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition border ${multiSelectMode ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                    >
                      {multiSelectMode ? "Cancel Select" : "Select Multiple"}
                    </button>
                    <Suspense
                      fallback={
                        <div className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300">
                          Loading...
                        </div>
                      }
                    >
                      <DownloadProgress
                        onDownload={async (onProgress) => {
                          const imageUrls = headshots.map((h) => h.image_url);
                          if (imageUrls.length === 0) {
                            toast("No images to download.", "error");
                            return;
                          }
                          await serverSideDownload(
                            imageUrls,
                            `truzot-headshots-${orderId}.zip`,
                            onProgress,
                          );
                        }}
                        label="Download All"
                      />
                    </Suspense>
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
              {currentOrder.status === "pending" && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6">
                    <Camera className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    Payment Incomplete
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
                    You left this order unpaid. You can pick up right where you
                    left off and complete your checkout.
                  </p>
                  <button
                    onClick={async () => {
                      const prefs =
                        (currentOrder.preferences as Record<string, any>) || {};
                      const {
                        data: { session },
                      } = await supabase.auth.getSession();
                      const token = session?.access_token;
                      const authHeaders: Record<string, string> = {
                        "Content-Type": "application/json",
                      };
                      if (token) authHeaders.Authorization = `Bearer ${token}`;
                      const idempotencyKey = crypto.randomUUID();
                      try {
                        const res = await fetch("/api/checkout", {
                          method: "POST",
                          headers: authHeaders,
                          body: JSON.stringify({
                            plan: currentOrder.plan,
                            email: currentOrder.email || "",
                            storagePath: prefs.storagePath || "",
                            gender: prefs.gender || "",
                            eyeColor: prefs.eyeColor || "",
                            hairColor: prefs.hairColor || "",
                            clothing: prefs.clothing || "",
                            background: prefs.background || "",
                            framing: prefs.framing || "",
                            selectedStyles: prefs.selectedStyles || [],
                            idempotencyKey,
                          }),
                        });
                        if (!res.ok) {
                          const errBody = await res.json().catch(() => null);
                          toast(errBody?.error || "Checkout failed", "error");
                          return;
                        }
                        const { url } = await res.json();
                        if (url) window.location.href = url;
                      } catch {
                        toast("Checkout failed. Please try again.", "error");
                      }
                    }}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 mx-auto shadow-sm"
                  >
                    Resume Payment <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
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
                          "X-Requested-With": "XMLHttpRequest",
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
            </motion.div>
          ) : !orderError ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              key="library-view"
            >
              <ProjectLibrary
                orders={orders}
                onDelete={handleDeleteOrder}
                onRetry={handleRetryOrder}
                onResumeCheckout={handleResumeCheckout}
                onCancel={handleCancelOrder}
                onRename={handleRenameOrder}
              />
            </motion.div>
          ) : null}
        </motion.div>
      </main>

      {multiSelectMode && selectedImages.length > 0 && (
        <FloatingSelectionBar
          selectedCount={selectedImages.length}
          downloading={downloading}
          downloadProgress={downloadProgress}
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
            <Suspense fallback={null}>
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
                onRegenerate={handleRegenerateHeadshot}
              />
            </Suspense>
          );
        })()}
      {confirmModal && (
        <ConfirmModal
          isOpen={true}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          confirmStyle={confirmModal.confirmStyle}
          onConfirm={confirmModal.action}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-secondary)] p-6 md:p-10">
          <div className="skeleton h-10 w-64 mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-48 rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <ErrorBoundary
        fallback={
          <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col items-center justify-center px-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <span className="text-red-500 text-2xl">!</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Something went wrong
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md text-center mb-8">
              The dashboard encountered an unexpected error. Please try
              reloading.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
            >
              Reload Page
            </button>
          </div>
        }
      >
        <DashboardContent />
      </ErrorBoundary>
    </Suspense>
  );
}
