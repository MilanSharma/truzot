/* eslint-disable @next/next/no-img-element */
"use client";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Plus,
  ArrowRight,
  Camera,
  CheckCircle,
  Trash2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  RefreshCw,
  ShoppingCart,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Eye,
  EyeOff,
  TrashIcon,
  Sparkles,
  X,
  Edit,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/plans";
import type { Order, Headshot } from "@/lib/types";
import { timeAgo, groupByDate, DATE_GROUPS } from "@/lib/time";
import { supabase } from "@/lib/supabase/client";

const ABANDONED_THRESHOLD_MS = 60 * 60 * 1000;

function ProjectSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <div className="h-10 w-48 bg-white/5 rounded-xl mb-2 animate-pulse" />
          <div className="h-4 w-32 bg-white/5 rounded-md animate-pulse" />
        </div>
        <div className="h-12 w-32 bg-white/5 rounded-xl animate-pulse" />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 bg-white/5 rounded-3xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function OrderCardActions({
  order,
  onDelete,
  onRetry,
  onResumeCheckout,
  onCancel,
  onRename,
}: {
  order: Order;
  onDelete?: (id: string) => void;
  onRetry?: (id: string) => void;
  onResumeCheckout?: (id: string) => void;
  onCancel?: (id: string) => void;
  onRename?: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ below: boolean; left: number; top: number }>({ below: true, left: 0, top: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!buttonRef.current || !menuRef.current) return;
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const menuWidth = menuRect.width || 192;
    const menuHeight = menuRect.height || 200;
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    const below = spaceBelow >= menuHeight || spaceBelow >= spaceAbove;
    const viewportRight = window.innerWidth - 12;
    const buttonRight = buttonRect.right;
    const menuLeft = buttonRight - menuWidth;
    const finalLeft = Math.max(12, Math.min(menuLeft, viewportRight - menuWidth));
    const finalTop = below ? buttonRect.bottom + 8 : buttonRect.top - menuHeight - 8;
    setMenuPosition({ below, left: finalLeft, top: finalTop });
  }, []);

  useEffect(() => {
    if (menuOpen) {
      const timer = setTimeout(() => calculatePosition(), 0);
      window.addEventListener("resize", calculatePosition);
      window.addEventListener("scroll", calculatePosition, true);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", calculatePosition);
        window.removeEventListener("scroll", calculatePosition, true);
      };
    }
  }, [menuOpen, calculatePosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuOpen(!menuOpen);
        }}
        className="p-1.5 text-white/40 hover:text-white hover:bg-slate-100 rounded-lg transition"
        title="More actions"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {menuOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] w-48 bg-white rounded-2xl border border-slate-200 shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-100"
            style={{
              left: menuPosition.left,
              top: menuPosition.top,
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            {onRename && (
              <button
                onClick={(e) => { e.stopPropagation(); onRename(order.id); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-white/60 hover:bg-slate-50 transition text-left whitespace-nowrap"
              >
                <Edit className="w-4 h-4 shrink-0" /> Rename Shoot
              </button>
            )}
            {["training", "generating"].includes(order.status) && onCancel && (
              <button
                onClick={(e) => { e.stopPropagation(); onCancel(order.id); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-400/10 transition text-left whitespace-nowrap"
              >
                <X className="w-4 h-4 shrink-0" /> Stop Processing
              </button>
            )}
            {order.status === "failed" && onRetry && (
              <button
                onClick={(e) => { e.stopPropagation(); onRetry(order.id); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-white/60 hover:bg-slate-50 transition text-left whitespace-nowrap"
              >
                <RefreshCw className="w-4 h-4 shrink-0" /> Retry Generation
              </button>
            )}
            {order.status === "pending" && onResumeCheckout && (
              <button
                onClick={(e) => { e.stopPropagation(); onResumeCheckout(order.id); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-white/60 hover:bg-slate-50 transition text-left whitespace-nowrap"
              >
                <ShoppingCart className="w-4 h-4 shrink-0" /> Resume Checkout
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(order.id); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-400/10 transition text-left whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4 shrink-0" /> Delete Shoot
              </button>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

function ExpiryCountdown({ createdAt }: { createdAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const created = new Date(createdAt).getTime();
  const expiryMs = created + 30 * 24 * 60 * 60 * 1000;
  const remainingMs = expiryMs - now;
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

  if (remainingMs <= 0) {
    return <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded">Expired</span>;
  }
  if (remainingDays <= 3) {
    return <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded animate-pulse">Deletes in {remainingDays}d</span>;
  }
  if (remainingDays <= 10) {
    return <span className="text-[10px] font-bold text-amber-700 bg-amber-400/10 px-2 py-0.5 rounded">Deletes in {remainingDays}d</span>;
  }
  return <span className="text-[10px] text-white/30 font-medium">Deletes in {remainingDays}d</span>;
}

function HeadshotPreviews({ orderId, count }: { orderId: string; count: number }) {
  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("headshots")
      .select("image_url")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true })
      .limit(3)
      .then(({ data }) => {
        if (!cancelled && data) setPreviews(data.map((h) => h.image_url));
      });
    return () => { cancelled = true; };
  }, [orderId]);

  return (
    <div className="flex items-center gap-1.5 mb-3">
      {previews.map((url, i) => (
        <div key={url} className="w-[calc(33.333%-4px)] aspect-[4/3] rounded-lg bg-white/5 overflow-hidden border border-slate-200">
          <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      ))}
      {previews.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-white/40 py-2">
          <Camera className="w-4 h-4" />
          <span>{count} headshots</span>
        </div>
      )}
    </div>
  );
}

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "completed", label: "Completed" },
  { id: "processing", label: "Processing" },
  { id: "failed", label: "Failed" },
  { id: "pending", label: "Pending" },
] as const;

export default function ProjectLibrary({
  orders,
  loading = false,
  onDelete,
  onRetry,
  onResumeCheckout,
  onCancel,
  onRename,
}: {
  orders: Order[];
  loading?: boolean;
  onDelete?: (id: string) => void;
  onRetry?: (id: string) => void;
  onResumeCheckout?: (id: string) => void;
  onCancel?: (id: string) => void;
  onRename?: (id: string) => void;
}) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [showAbandoned, setShowAbandoned] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const [trainingProgress, setTrainingProgress] = useState<Record<string, number>>({});
  useEffect(() => {
    const trainingOrders = (orders || []).filter((o) => o.status === "training");
    if (trainingOrders.length === 0) return;
    const poll = () => {
      for (const o of trainingOrders) {
        fetch(`/api/training/progress?orderId=${o.id}`)
          .then((r) => r.json())
          .then((data) => {
            const typedData = data as { progress?: number };
            if (typeof typedData.progress === "number")
              setTrainingProgress((prev) => ({ ...prev, [o.id]: typedData.progress! }));
          })
          .catch(() => {});
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [orders]);

  const completedCount = useMemo(() => orders.filter((o) => o.status === "completed").length, [orders]);
  const totalHeadshots = useMemo(() => orders.filter((o) => o.status === "completed").reduce((sum, o) => {
    const p = PLANS[o.plan as keyof typeof PLANS];
    return sum + (p?.shots || 0);
  }, 0), [orders]);

  const abandonedOrders = useMemo(() => orders.filter((o) => {
    if (o.status !== "pending") return false;
    const created = new Date(o.created_at).getTime();
    return now - created > ABANDONED_THRESHOLD_MS;
  }), [orders, now]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];
    if (filterStatus !== "all") {
      if (filterStatus === "processing") {
        result = result.filter((o) => ["training", "generating"].includes(o.status));
      } else {
        result = result.filter((o) => o.status === filterStatus);
      }
    }
    const activePending = result.filter((o) => !(o.status === "pending" && now - new Date(o.created_at).getTime() > ABANDONED_THRESHOLD_MS));
    result = showAbandoned ? result : activePending;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((o) => {
        const name = o.shoot_name || ((o.preferences as Record<string, any>)?.shootName as string) || "";
        const planName = PLANS[o.plan as keyof typeof PLANS]?.name?.toLowerCase() || "";
        return name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || planName.includes(q);
      });
    }
    result.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });
    return result;
  }, [orders, filterStatus, searchQuery, sortOrder, showAbandoned, now]);

  const groups = groupByDate(filteredOrders);

  const getThumbnail = (order: Order): string | null => {
    const prefs = order.preferences as Record<string, any> | undefined;
    return order.source_image_url || prefs?.sourceImageUrl || null;
  };

  const getShootName = (order: Order): string => {
    if (order.shoot_name) return order.shoot_name;
    const prefs = order.preferences as Record<string, any> | undefined;
    if (prefs?.shootName) return prefs.shootName as string;
    const planName = PLANS[order.plan as keyof typeof PLANS]?.name;
    return planName || "Untitled Shoot";
  };

  if (loading) return <ProjectSkeleton />;

  return (
    <div className="animate-in fade-in">
      {/* Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-1">My Projects</h1>
          <p className="text-sm text-slate-500 font-medium">{orders.length} {orders.length === 1 ? "shoot" : "shoots"} total</p>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem("truzot-upload");
            localStorage.removeItem("truzot-upload");
            localStorage.removeItem("truzot-upload-backup");
            sessionStorage.removeItem("truzot-idempotency-key");
            router.push("/upload");
          }}
          className="inline-flex items-center gap-2 bg-lime-500 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-lime-300 transition-all duration-200 active:scale-95 shadow-lg shadow-lime-400/20"
        >
          <Plus className="w-4 h-4" /> New Shoot
        </button>
      </div>

      {/* Stats row */}
      {completedCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Completed</p>
            <p className="text-2xl font-black text-[var(--text)]">{completedCount}</p>
          </div>
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Headshots</p>
            <p className="text-2xl font-black text-[var(--text)]">{totalHeadshots.toLocaleString()}</p>
          </div>
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Active</p>
            <p className="text-2xl font-black text-[var(--lime)]">{orders.filter((o) => o.status !== "pending").length}</p>
          </div>
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Abandoned</p>
            <p className="text-2xl font-black text-amber-600">{abandonedOrders.length}</p>
          </div>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm mb-6">
        <div className="p-3 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by shoot name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[var(--surface2)] border border-[var(--border)] rounded-2xl text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--lime)]"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-2xl border transition ${
              showFilters
                ? "bg-[var(--lime-dim)] border-[var(--lime-border)] text-[var(--lime)]"
                : "bg-[var(--surface2)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
            title="Toggle filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {showFilters && (
          <div className="px-3 pb-3 pt-0 border-t border-[var(--border)]">
            {/* Status tabs */}
            <div className="flex flex-wrap gap-1.5 mt-3 mb-3">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    filterStatus === tab.id
                      ? "bg-[var(--lime)] text-[var(--lime-on)] shadow-sm"
                      : "bg-[var(--surface2)] text-[var(--text-muted)] hover:bg-[var(--surface3)] border border-[var(--border)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sort + abandoned toggle */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                  className="bg-[var(--surface2)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--lime)]"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
              {abandonedOrders.length > 0 && (
                <button
                  onClick={() => setShowAbandoned(!showAbandoned)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    showAbandoned
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-[var(--surface2)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text)]"
                  }`}
                >
                  {showAbandoned ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {abandonedOrders.length} Abandoned
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Abandoned warning banner */}
      {abandonedOrders.length > 0 && !showAbandoned && (
        <div className="mb-6 p-4 bg-amber-400/10 border border-amber-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-400/20 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
            <p className="text-sm font-bold text-amber-700">
              {abandonedOrders.length} abandoned checkout{abandonedOrders.length !== 1 ? "s" : ""} hidden
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAbandoned(true)}
              className="px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-400/10 rounded-lg transition"
            >
              Show
            </button>
            <button
              onClick={async () => {
                let successCount = 0;
                for (const o of abandonedOrders) {
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.access_token) {
                      const res = await fetch(`/api/orders?id=${o.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.access_token}` } });
                      if (res.ok) successCount++;
                    }
                  } catch (err) {
                    console.error("Failed to delete order:", o.id, err);
                  }
                }
                if (successCount > 0) {
                  router.refresh();
                }
              }}
              className="px-3 py-1.5 text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 rounded-lg transition"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="text-center py-32 bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--lime-dim)] rounded-full blur-[120px] pointer-events-none transition-colors duration-1000" />

          <div className="relative z-10">
            <div className="w-24 h-24 bg-[var(--lime-dim)] border border-[var(--lime-border)] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Camera className="w-10 h-10 text-[var(--lime)]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[var(--text)] mb-4 tracking-tight">
              {searchQuery || filterStatus !== "all" ? "No matching shoots" : "Create your first AI studio"}
            </h2>
            <p className="text-lg text-[var(--text-muted)] max-w-lg mx-auto mb-10 leading-relaxed">
              {searchQuery || filterStatus !== "all"
                ? "Try a different search or filter."
                : "Generate premium corporate headshots without leaving your home. Results in under an hour."}
            </p>
            {!searchQuery && filterStatus === "all" && (
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 bg-[var(--lime)] text-[var(--lime-on)] px-10 py-5 rounded-2xl text-lg font-bold hover:brightness-110 transition-transform shadow-[var(--shadow-lime)] active:scale-95"
              >
                Start New Shoot <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {DATE_GROUPS.filter((g) => groups[g]?.length).map((group) => (
            <div key={group}>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                {group === "Today" || group === "Yesterday"
                  ? group
                  : `${group} — ${groups[group].length} shoot${groups[group].length > 1 ? "s" : ""}`}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {groups[group].map((o) => (
                  <div
                    key={o.id}
                    className={`bg-white rounded-3xl border shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-400 ease-out transform hover:-translate-y-1 group relative z-0 focus-within:z-10 hover:z-10 overflow-visible ${
                      o.status === "failed"
                        ? "border-red-200 hover:border-red-400/30"
                        : o.status === "refunded"
                          ? "border-slate-200 hover:border-white/20"
                          : o.status === "pending"
                            ? "border-amber-200 hover:border-amber-400/30"
                            : "border-slate-200 hover:border-lime-200"
                    }`}
                  >
                    <Link href={`/dashboard?order=${o.id}`} className="block p-6">
                      {/* Status badge top-right */}
                      {o.status === "completed" && (
                        <div className="absolute top-0 right-0 w-16 h-16 bg-lime-400/10 rounded-tr-2xl rounded-bl-full flex items-start justify-end p-3">
                          <CheckCircle className="w-4 h-4 text-lime-400" />
                        </div>
                      )}

                      {/* Thumbnail + info row */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                          {getThumbnail(o) ? (
                            <img src={getThumbnail(o)!} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="w-6 h-6 text-white/30" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-black text-lime-600 tracking-widest uppercase mb-0.5 block">
                            {PLANS[o.plan as keyof typeof PLANS]?.name || "Shoot"}
                          </span>
                          <h3 className="text-lg font-bold text-slate-900 truncate">{getShootName(o)}</h3>
                        </div>
                      </div>

                      {/* Headshot preview strip */}
                      {o.status === "completed" && (
                        <HeadshotPreviews orderId={o.id} count={PLANS[o.plan as keyof typeof PLANS]?.shots || 40} />
                      )}

                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500 font-medium">{timeAgo(o.created_at)}</span>
                        {o.status === "completed" && <ExpiryCountdown createdAt={o.created_at} />}
                      </div>

                      {/* Progress bar */}
                      {["training", "generating"].includes(o.status) && (
                        <div className="mt-3 mb-3">
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-lime-500 to-lime-400 rounded-full transition-all duration-700"
                              style={{
                                width: `${o.status === "training" ? Math.max(3, trainingProgress[o.id] ?? 0) : o.status === "generating" ? 65 : 0}%`,
                              }}
                            />
                          </div>
                          <p className="text-[10px] text-lime-400 font-semibold mt-1">
                            {o.status === "training" ? `Training AI model... ${trainingProgress[o.id] ?? 0}%` : "Generating headshots..."}
                          </p>
                        </div>
                      )}

                      {/* Status badge */}
                      <div className="flex items-center justify-between mt-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold ${
                            o.status === "completed"
                              ? "bg-lime-50 text-lime-700"
                              : ["training", "generating"].includes(o.status)
                                ? "bg-blue-50 text-blue-700"
                                : o.status === "pending"
                                  ? "bg-amber-50 text-amber-700"
                                  : o.status === "refunded"
                                    ? "bg-slate-100 text-slate-600"
                                    : "bg-red-50 text-red-700"
                          }`}
                        >
                          {o.status === "completed" ? "Gallery Ready" : o.status === "failed" ? <><AlertCircle className="w-3 h-3" /> Failed</> : o.status === "refunded" ? <><AlertCircle className="w-3 h-3" /> Refunded</> : o.status === "pending" ? "Payment Pending" : <><div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" /> Processing</>}
                        </span>
                      </div>
                    </Link>

                    {/* Action buttons */}
                    <div className="px-6 pb-4 pt-0 flex items-center gap-2 flex-wrap">
                      {o.status === "pending" && onResumeCheckout && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onResumeCheckout(o.id); }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-400/20 transition"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Resume Checkout
                        </button>
                      )}
                      {o.status === "failed" && onRetry && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onRetry(o.id); }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-400/20 transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Retry Generation
                        </button>
                      )}
                      {o.status === "completed" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard?order=${o.id}`); }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-indigo-400/20 rounded-lg text-xs font-bold hover:bg-indigo-400/20 transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> View Gallery
                        </button>
                      )}
                      <div className="ml-auto">
                        <OrderCardActions order={o} onDelete={onDelete} onRetry={onRetry} onResumeCheckout={onResumeCheckout} onCancel={onCancel} onRename={onRename} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}