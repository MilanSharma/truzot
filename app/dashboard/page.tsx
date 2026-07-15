"use client";
import AILoadingAnimation from "@/components/AILoadingAnimation";
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
import { downloadAsZip } from "@/lib/download";
import JSZip from "jszip";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { PLANS } from "@/lib/plans";
import type { User, Order, Headshot } from "@/lib/types";
import {
  Camera,
  ChevronRight,
  Share2,
  Mail,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileDrawer from "@/components/dashboard/MobileDrawer";
const ProjectLibrary = dynamic(
  () => import("@/components/dashboard/ProjectLibrary"),
  { ssr: false },
);
const TrainingView = dynamic(
  () => import("@/components/dashboard/TrainingView"),
  { ssr: false },
);
const GeneratingView = dynamic(
  () => import("@/components/dashboard/GeneratingView"),
  { ssr: false },
);
const FailedView = dynamic(() => import("@/components/dashboard/FailedView"), {
  ssr: false,
});
const CompletedGallery = dynamic(
  () => import("@/components/dashboard/CompletedGallery"),
  { ssr: false },
);
import FloatingSelectionBar from "@/components/dashboard/FloatingSelectionBar";
import GalleryErrorBoundary from "@/components/GalleryErrorBoundary";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";
import PromptModal from "@/components/PromptModal";
import { motion, AnimatePresence } from "framer-motion";

const LightboxModal = lazy(
  () => import("@/components/dashboard/LightboxModal"),
);
const DownloadProgress = lazy(() => import("@/components/DownloadProgress"));

function PendingOrderPreviews({ storagePath }: { storagePath?: string }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(!!storagePath);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    urlsRef.current = urls;
  }, [urls]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        if (!storagePath) {
          setLoading(false);
          setUrls([]);
          return;
        }
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || ""}`,
          },
          body: JSON.stringify({
            action: "get-download-url",
            path: storagePath,
          }),
        });
        if (!res.ok) throw new Error("failed");
        const { zipUrl } = (await res.json()) as { zipUrl?: string };
        if (!zipUrl) throw new Error("No zipUrl returned");

        const zipRes = await fetch(zipUrl);
        const zipBlob = await zipRes.blob();
        const zip = await JSZip.loadAsync(zipBlob);

        const imgUrls: string[] = [];
        for (const [filename, file] of Object.entries(zip.files)) {
          if (!file.dir && filename.match(/\.(jpg|jpeg|png|heic)$/i)) {
            const blob = await file.async("blob");
            imgUrls.push(URL.createObjectURL(blob));
            if (imgUrls.length >= 5) break;
          }
        }
        if (active) {
          setUrls(imgUrls);
          setLoading(false);
        }
      } catch (e) {
        if (active) setLoading(false);
      }
    };

    const t = setTimeout(() => {
      if (active) load();
    }, 0);

    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [storagePath]);

  useEffect(() => {
    return () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  if (loading)
    return (
      <div className="flex justify-center mb-6">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  if (urls.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 justify-center mb-8">
      {urls.map((u, i) => (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={i}
          src={u}
          className="w-16 h-16 object-cover rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
          alt={`Uploaded photo preview ${i + 1}`}
          width={64}
          height={64}
        />
      ))}
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = searchParams.get("order");
  const sessionId = searchParams.get("session_id");

  const [currentTime, setCurrentTime] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  // SHA-256 helper for Google Enhanced Conversions
  const sha256 = async (message: string) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  // Fetch session details and trigger value-based tracking
  useEffect(() => {
    if (!sessionId || !currentOrder || currentOrder.status !== "completed") return;

    const triggerValueTracking = async () => {
      try {
        const res = await fetch(`/api/get-session?session_id=${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.amount && data.currency) {
          // Meta Pixel with value-based tracking and deduplication
          if (typeof window !== "undefined" && (window as any).fbq) {
            (window as any).fbq("track", "Purchase", {
              value: data.amount,
              currency: data.currency,
            }, { 
              eventID: sessionId 
            });
          }

          // Google Ads with value-based tracking and Enhanced Conversions
          if (typeof window !== "undefined" && (window as any).gtag) {
            // Set user data for Enhanced Conversions
            if (data.email) {
              const hashedEmail = await sha256(data.email.trim().toLowerCase());
              (window as any).gtag("set", "user_data", {
                sha256_email_address: hashedEmail,
              });
            }

            // Fire conversion event
            (window as any).gtag("event", "conversion", {
              send_to: "AW-18276640380/bFSfCJb0pM8cEPzM_YpE",
              value: data.amount,
              currency: data.currency,
              transaction_id: sessionId,
            });
          }
        }
      } catch (err) {
        console.error("Error triggering value-based tracking:", err);
      }
    };

    triggerValueTracking();
  }, [sessionId, currentOrder]);

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
  const [authChecked, setAuthChecked] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [resumingPayment, setResumingPayment] = useState(false);
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

  const initFavsRef = useRef(false);

  useEffect(() => {
    if (headshots.length > 0 && !hasMoreHeadshots && !initFavsRef.current) {
      initFavsRef.current = true;
      setFavorites((prev) => {
        const validUrls = new Set(headshots.map((h) => h.image_url));
        const next = prev.filter((f) => validUrls.has(f));
        if (next.length !== prev.length && orderId) {
          localStorage.setItem(`truzot-favs-${orderId}`, JSON.stringify(next));
          return next;
        }
        return prev;
      });
    }
  }, [headshots, hasMoreHeadshots, orderId]);

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
        const emailToken =
          new URLSearchParams(window.location.search).get("email_token") ??
          undefined;
        const apiUrl = downloadToken
          ? `/api/order-status?orderId=${id}&download_token=${downloadToken}`
          : emailToken
            ? `/api/order-status?orderId=${id}&email_token=${emailToken}`
            : `/api/order-status?orderId=${id}`;
        const res = await fetch(apiUrl, {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        });
        const statusData = (await res.json()) as {
          status?: string;
          plan?: string;
        };
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
        const data = (await res.json()) as {
          status?: string;
          headshots?: any[];
          count?: number;
          target?: number;
        };
        if (data.status === "completed") {
          if ((data.headshots?.length ?? 0) > 0) {
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
          setIsSigningOut(true);
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

  const MAX_ZIP_IMAGES = 250;
  const ZIP_BATCH_SIZE = 100;

  const handleDownload = async (
    urls: string[],
    filename: string,
    onProgress?: (current: number, total: number) => void,
  ) => {
    // Use client-side download to avoid timeout on Vercel Hobby plan
    if (!orderId) throw new Error("No order ID");

    // Implement automatic batching for large orders (Executive plan = 200 images)
    const BATCH_SIZE = 50;
    if (urls.length > BATCH_SIZE) {
      const batches: string[][] = [];
      for (let i = 0; i < urls.length; i += BATCH_SIZE) {
        batches.push(urls.slice(i, i + BATCH_SIZE));
      }

      if (batches.length > 1) {
        toast(`Downloading ${batches.length} ZIP files...`, "info");
      }

      let totalFailed = 0;
      for (let i = 0; i < batches.length; i++) {
        const batchUrls = batches[i];
        const batchFilename = `${filename.replace(".zip", "")}_part${i + 1}.zip`;

        if (onProgress) onProgress(i + 1, batches.length);

        // Pass empty function to prevent inner image progress from overriding outer batch progress
        const result = await downloadAsZip(
          batchUrls,
          orderId,
          batchFilename,
          () => {},
        );
        totalFailed += result.failedCount;

        // Small delay between downloads to prevent browser blocking
        if (i < batches.length - 1) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      toast(`Downloaded ${batches.length} ZIP files`, "success");
      if (totalFailed > 0) {
        toast(
          `${totalFailed} images failed to download. Check console for details.`,
          "info",
        );
      }
    } else {
      const result = await downloadAsZip(urls, orderId, filename, onProgress);
      if (result.failedCount > 0) {
        toast(
          `${result.failedCount} images failed to download. Check console for details.`,
          "info",
        );
      }
    }
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
      const { token: dlToken } = (await res.json()) as { token?: string };
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
      // Use proxy to bypass CORS
      const proxyUrl = `/api/download/proxy?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) return;
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
    setDownloadProgress({ current: 0, total: selectedImages.length });
    try {
      await handleDownload(
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
        "X-Requested-With": "XMLHttpRequest",
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
    const order = orders.find((o) => o.id === id) || fetchedOrder;
    if (!order) return;
    setResumingPayment(true);
    const prefs = (order.preferences as Record<string, any>) || {};
    sessionStorage.setItem(
      "truzot-upload",
      JSON.stringify({
        step: 2,
        plan: order.plan,
        email: order.email || "",
        consentChecked: true,
        storagePath: prefs.storagePath || "",
        filesCount: 0,
        shootName: order.shoot_name || prefs.shootName || "",
        idempotencyKey: prefs.idempotency_key || "",
        coupon: order.discount_code || "",
      }),
    );
    router.push("/upload");
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
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Requested-With": "XMLHttpRequest",
            },
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
            const data = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            toast(data.error || "Failed to cancel shoot", "error");
          }
        } catch (err) {
          toast("Failed to cancel shoot", "error");
        }
      },
    });
  };

  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    initialValue: string;
    action: (val: string) => void;
  } | null>(null);

  const handleRenameOrder = async (id: string) => {
    const currentName = orders.find((o) => o.id === id)?.shoot_name || "";
    setPromptModal({
      isOpen: true,
      title: "Rename Shoot",
      message: "Enter a new name for this shoot:",
      initialValue: currentName,
      action: async (newName: string) => {
        if (!newName) {
          setPromptModal(null);
          return;
        }
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, shoot_name: newName } : o)),
        );
        if (currentOrder && currentOrder.id === id) {
          setFetchedOrder((prev) =>
            prev ? { ...prev, shoot_name: newName } : prev,
          );
        }
        toast("Shoot renamed", "success");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          await supabase
            .from("orders")
            .update({ shoot_name: newName })
            .eq("id", id);
        }
        setPromptModal(null);
      },
    });
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
        // Optimistic UI Update: instantly remove from view
        setConfirmModal(null);
        const previousOrders = [...orders];
        setOrders((prev) => prev.filter((o) => o.id !== id));
        if (orderId === id) {
          setFetchedOrder(null);
          router.replace("/dashboard");
        }
        toast("Deleting shoot...", "info");

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
            toast("Shoot deleted successfully", "success");
          } else {
            const data = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            setOrders(previousOrders); // Rollback on fail
            toast(data.error || "Failed to delete shoot", "error");
          }
        } catch (err) {
          setOrders(previousOrders); // Rollback on fail
          toast("Failed to delete shoot", "error");
        }
      },
    });
  };

  if (isSigningOut) return null;

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
          className="bg-lime-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-lime-600 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const currentFiltered = getFilteredHeadshots();

  return (
    <div className="flex h-screen bg-white font-sans text-[var(--text-primary)] overflow-hidden">
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
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                Order Not Found
              </h2>
              <p className="text-slate-500 max-w-md mb-8">{orderError}</p>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center bg-lime-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-lime-600 transition"
              >
                Back to Library
              </Link>
            </div>
          )}
          <AnimatePresence mode="wait">
            {orderId && !orderError && currentOrder ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.2 }}
                key="detail-view"
              >
                {currentOrder &&
                  ["training", "generating"].includes(currentOrder.status) &&
                  currentTime - new Date(currentOrder.created_at).getTime() >
                    30 * 60 * 1000 && (
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
                      <div className="text-sm text-amber-800 dark:text-amber-300">
                        <span className="font-bold flex items-center gap-1 mb-1">
                          <AlertCircle className="w-4 h-4" /> Processing is
                          taking longer than usual.
                        </span>
                        Our AI cluster might be under heavy load. If this
                        continues, please contact support.
                      </div>
                      <a
                        href={`mailto:hello@truzot.com?subject=Delayed Order: ${currentOrder.id}`}
                        className="shrink-0 px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700 transition"
                      >
                        Contact Support
                      </a>
                    </div>
                  )}
                {!user && (
                  <div className="mb-8 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
                    <div>
                      <h3 className="text-blue-900 dark:text-blue-100 font-bold text-lg mb-1">
                        Save your progress
                      </h3>
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        Create an account to securely access your headshots
                        anytime.
                      </p>
                    </div>
                    <Link
                      href={`/claim-order?order=${orderId}`}
                      className="shrink-0 px-6 py-3 bg-lime-500 text-white rounded-xl font-bold text-sm hover:bg-lime-600 transition"
                    >
                      Create Account
                    </Link>
                  </div>
                )}

                {currentOrder &&
                  ["training", "generating"].includes(currentOrder.status) &&
                  currentTime > 0 &&
                  currentTime - new Date(currentOrder.created_at).getTime() >
                    30 * 60 * 1000 && (
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
                      <div className="text-sm text-amber-800 dark:text-amber-300">
                        <span className="font-bold flex items-center gap-1 mb-1">
                          <AlertCircle className="w-4 h-4" /> Processing is
                          taking longer than usual.
                        </span>
                        Our AI cluster might be under heavy load. If this
                        continues, please contact support.
                      </div>
                      <a
                        href={`mailto:hello@truzot.com?subject=Delayed Order: ${currentOrder.id}`}
                        className="shrink-0 px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700 transition"
                      >
                        Contact Support
                      </a>
                    </div>
                  )}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <Link
                      href="/dashboard"
                      className="text-xs font-bold text-slate-400 hover:text-blue-600 mb-2 flex items-center gap-1 transition"
                    >
                      ← Back to library
                    </Link>
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-black text-slate-900">
                        {PLANS[currentOrder.plan as keyof typeof PLANS]?.name ||
                          "Shoot"}
                      </h1>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          currentOrder.status === "completed"
                            ? "bg-lime-50 text-lime-700 border-lime-200"
                            : currentOrder.status === "failed"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : currentOrder.status === "refunded"
                                ? "bg-slate-100 text-slate-600 border-slate-200"
                                : currentOrder.status === "pending"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {currentOrder.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-1">
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

                  {(currentOrder.status === "generating" ||
                    currentOrder.status === "paid") && (
                    <div className="mt-6 w-full">
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
                        <h3 className="font-bold text-emerald-900 dark:text-emerald-100 mb-2 flex items-center gap-2">
                          <Sparkles className="w-5 h-5" /> Payment Successful!
                          Here&apos;s what happens next:
                        </h3>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-emerald-800 dark:text-emerald-300">
                          <li>
                            We&apos;re training your custom AI model (5-15
                            minutes)
                          </li>
                          <li>
                            Generating{" "}
                            {PLANS[currentOrder.plan as keyof typeof PLANS]
                              ?.shots || 20}{" "}
                            professional headshots
                          </li>
                          <li>
                            You&apos;ll get an email when they&apos;re ready to
                            download
                          </li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {currentOrder.status === "completed" && (
                    <>
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
                            await handleDownload(
                              imageUrls,
                              `truzot-headshots-${orderId}.zip`,
                              onProgress,
                            );
                          }}
                          label="Download All"
                        />
                      </Suspense>
                    </div>
                    </>
                  )}
                </div>

                {currentOrder.status === "refunded" && (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm mt-12 max-w-2xl mx-auto p-10">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                      <AlertCircle className="w-8 h-8 text-slate-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">
                      Order Refunded
                    </h2>
                    <p className="text-slate-500 max-w-md mb-8">
                      This shoot encountered a fatal error and was automatically
                      refunded to your original payment method.
                    </p>
                    <button
                      onClick={() => router.push("/upload")}
                      className="inline-flex items-center gap-2 bg-lime-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-lime-600 transition shadow-sm"
                    >
                      Start New Shoot
                    </button>
                  </div>
                )}
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
                    <PendingOrderPreviews
                      storagePath={
                        (currentOrder.preferences as Record<string, any>)
                          ?.storagePath as string | undefined
                      }
                    />
                    <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6">
                      <Camera className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">
                      Payment Incomplete
                    </h2>
                    <p className="text-slate-500 max-w-md mb-8">
                      You left this order unpaid. You can pick up right where
                      you left off and complete your checkout.
                    </p>
                    <button
                      onClick={() => handleResumeCheckout(currentOrder.id)}
                      disabled={resumingPayment}
                      className="bg-lime-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-lime-600 transition flex items-center justify-center gap-2 mx-auto shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resumingPayment ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Resume Payment <ChevronRight className="w-5 h-5" />
                        </>
                      )}
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
                    />
                  </GalleryErrorBoundary>
                )}
              </motion.div>
            ) : !orderError ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.2 }}
                key="library-view"
              >
                <ProjectLibrary
                  orders={orders}
                  loading={loading}
                  onDelete={handleDeleteOrder}
                  onRetry={handleRetryOrder}
                  onResumeCheckout={handleResumeCheckout}
                  onCancel={handleCancelOrder}
                  onRename={handleRenameOrder}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
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
      {promptModal && (
        <PromptModal
          isOpen={promptModal.isOpen}
          title={promptModal.title}
          message={promptModal.message}
          initialValue={promptModal.initialValue}
          onConfirm={promptModal.action}
          onCancel={() => setPromptModal(null)}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[var(--bg-secondary)]" />}
    >
      <ErrorBoundary
        fallback={
          <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col items-center justify-center px-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <span className="text-red-500 text-2xl">!</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Something went wrong
            </h2>
            <p className="text-slate-500 max-w-md text-center mb-8">
              The dashboard encountered an unexpected error. Please try
              reloading.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-lime-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-lime-600 transition"
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
