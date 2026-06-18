"use client";
import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
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
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import type { Order, Headshot } from "@/lib/types";
import { timeAgo, groupByDate, DATE_GROUPS } from "@/lib/time";
import { supabase } from "@/lib/supabase/client";

const ABANDONED_THRESHOLD_MS = 60 * 60 * 1000;

function ProjectSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm animate-pulse"
        >
          <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-6" />
          <div className="flex items-center justify-between">
            <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderCardActions({
  order,
  onDelete,
  onRetry,
  onResumeCheckout,
  onCancel,
}: {
  order: Order;
  onDelete?: (id: string) => void;
  onRetry?: (id: string) => void;
  onResumeCheckout?: (id: string) => void;
  onCancel?: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <div
      className="relative"
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuOpen(!menuOpen);
        }}
        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
        title="More actions"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 z-[100] animate-in fade-in zoom-in-95 duration-100">
          {["training", "generating"].includes(order.status) && onCancel && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel(order.id);
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition text-left whitespace-nowrap"
            >
              <X className="w-4 h-4 shrink-0" /> Stop Processing
            </button>
          )}
          {order.status === "failed" && onRetry && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRetry(order.id);
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4 shrink-0" /> Retry Generation
            </button>
          )}
          {order.status === "pending" && onResumeCheckout && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResumeCheckout(order.id);
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left whitespace-nowrap"
            >
              <ShoppingCart className="w-4 h-4 shrink-0" /> Resume Checkout
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(order.id);
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-left whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4 shrink-0" /> Delete Shoot
            </button>
          )}
        </div>
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
    return (
      <span className="text-[10px] font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
        Expired
      </span>
    );
  }

  if (remainingDays <= 3) {
    return (
      <span className="text-[10px] font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded animate-pulse">
        Deletes in {remainingDays}d
      </span>
    );
  }

  if (remainingDays <= 10) {
    return (
      <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded">
        Deletes in {remainingDays}d
      </span>
    );
  }

  return (
    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
      Deletes in {remainingDays}d
    </span>
  );
}

function HeadshotPreviews({
  orderId,
  count,
}: {
  orderId: string;
  count: number;
}) {
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
        if (!cancelled && data) {
          setPreviews(data.map((h) => h.image_url));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <div className="flex items-center gap-1.5 mb-3">
      {previews.map((url, i) => (
        <div
          key={url}
          className="w-[calc(33.333%-4px)] aspect-[4/3] rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700"
        >
          <img
            src={url}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
      {previews.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 py-2">
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
}: {
  orders: Order[];
  loading?: boolean;
  onDelete?: (id: string) => void;
  onRetry?: (id: string) => void;
  onResumeCheckout?: (id: string) => void;
  onCancel?: (id: string) => void;
}) {
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

  const [trainingProgress, setTrainingProgress] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    const trainingOrders = (orders || []).filter(
      (o) => o.status === "training",
    );
    if (trainingOrders.length === 0) return;
    const poll = () => {
      for (const o of trainingOrders) {
        fetch(`/api/training/progress?orderId=${o.id}`)
          .then((r) => r.json())
          .then((data) => {
            if (typeof data.progress === "number") {
              setTrainingProgress((prev) => ({
                ...prev,
                [o.id]: data.progress,
              }));
            }
          })
          .catch(() => {});
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [orders]);

  const completedCount = useMemo(
    () => orders.filter((o) => o.status === "completed").length,
    [orders],
  );
  const totalHeadshots = useMemo(
    () =>
      orders
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => {
          const p = PLANS[o.plan as keyof typeof PLANS];
          return sum + (p?.shots || 0);
        }, 0),
    [orders],
  );

  const abandonedOrders = useMemo(
    () =>
      orders.filter((o) => {
        if (o.status !== "pending") return false;
        const created = new Date(o.created_at).getTime();
        return now - created > ABANDONED_THRESHOLD_MS;
      }),
    [orders, now],
  );

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (filterStatus !== "all") {
      if (filterStatus === "processing") {
        result = result.filter((o) =>
          ["training", "generating"].includes(o.status),
        );
      } else {
        result = result.filter((o) => o.status === filterStatus);
      }
    }

    const activePending = result.filter(
      (o) =>
        !(
          o.status === "pending" &&
          now - new Date(o.created_at).getTime() > ABANDONED_THRESHOLD_MS
        ),
    );
    const abandoned = result.filter(
      (o) =>
        o.status === "pending" &&
        now - new Date(o.created_at).getTime() > ABANDONED_THRESHOLD_MS,
    );
    result = showAbandoned ? result : activePending;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((o) => {
        const name =
          o.shoot_name ||
          ((o.preferences as Record<string, any>)?.shootName as string) ||
          "";
        const planName =
          PLANS[o.plan as keyof typeof PLANS]?.name?.toLowerCase() || "";
        return (
          name.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          planName.includes(q)
        );
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
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1">
            My Projects
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {orders.length} {orders.length === 1 ? "shoot" : "shoots"} total
          </p>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem("truzot-upload");
            window.location.href = "/upload";
          }}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Shoot
        </button>
      </div>

      {/* Stats row */}
      {completedCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Completed
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {completedCount}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Headshots
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {totalHeadshots.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Active
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {orders.filter((o) => o.status !== "pending").length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Abandoned
            </p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {abandonedOrders.length}
            </p>
          </div>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
        <div className="p-3 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by shoot name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl border transition ${
              showFilters
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
            title="Toggle filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {showFilters && (
          <div className="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-700">
            {/* Status tabs */}
            <div className="flex flex-wrap gap-1.5 mt-3 mb-3">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    filterStatus === tab.id
                      ? "bg-slate-900 dark:bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sort + abandoned toggle */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <select
                  value={sortOrder}
                  onChange={(e) =>
                    setSortOrder(e.target.value as "newest" | "oldest")
                  }
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
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
                      ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {showAbandoned ? (
                    <EyeOff className="w-3 h-3" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                  {abandonedOrders.length} Abandoned
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Abandoned warning banner */}
      {abandonedOrders.length > 0 && !showAbandoned && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              {abandonedOrders.length} abandoned checkout
              {abandonedOrders.length !== 1 ? "s" : ""} hidden
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAbandoned(true)}
              className="px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition"
            >
              Show
            </button>
            <button
              onClick={async () => {
                for (const o of abandonedOrders) {
                  const {
                    data: { session },
                  } = await supabase.auth.getSession();
                  const token = session?.access_token;
                  if (token) {
                    await fetch(`/api/orders?id=${o.id}`, {
                      method: "DELETE",
                      headers: { Authorization: `Bearer ${token}` },
                    });
                  }
                }
                window.location.reload();
              }}
              className="px-3 py-1.5 text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 rounded-lg transition"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-500" />
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Camera className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            {searchQuery || filterStatus !== "all"
              ? "No matching shoots"
              : "Create your first AI models"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
            {searchQuery || filterStatus !== "all"
              ? "Try a different search or filter."
              : "Get high-end studio pictures in under an hour without setting foot outside."}
          </p>
          {!searchQuery && filterStatus === "all" && (
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-slate-900 dark:bg-blue-600 text-white px-8 py-4 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition shadow-lg"
            >
              Upload Selfies <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {DATE_GROUPS.filter((g) => groups[g]?.length).map((group) => (
            <div key={group}>
              <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                {group === "Today" || group === "Yesterday"
                  ? group
                  : `${group} — ${groups[group].length} shoot${groups[group].length > 1 ? "s" : ""}`}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {groups[group].map((o) => (
                  <div
                    key={o.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-sm hover:shadow-lg transition group relative z-0 focus-within:z-10 hover:z-10 ${
                      o.status === "failed"
                        ? "border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-600"
                        : o.status === "pending"
                          ? "border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-600"
                          : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600"
                    }`}
                  >
                    <Link
                      href={`/dashboard?order=${o.id}`}
                      className="block p-6"
                    >
                      {/* Status badge top-right */}
                      {o.status === "completed" && (
                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-tr-2xl rounded-bl-full flex items-start justify-end p-3">
                          <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        </div>
                      )}

                      {/* Thumbnail + info row */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                          {getThumbnail(o) ? (
                            <img
                              src={getThumbnail(o)!}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Camera className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-widest uppercase mb-0.5 block">
                            {PLANS[o.plan as keyof typeof PLANS]?.name ||
                              "Shoot"}
                          </span>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                            {getShootName(o)}
                          </h3>
                        </div>
                      </div>

                      {/* Headshot preview strip for completed orders */}
                      {o.status === "completed" && (
                        <HeadshotPreviews
                          orderId={o.id}
                          count={
                            PLANS[o.plan as keyof typeof PLANS]?.shots || 40
                          }
                        />
                      )}

                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                          {timeAgo(o.created_at)}
                        </span>
                        {o.status === "completed" && (
                          <ExpiryCountdown createdAt={o.created_at} />
                        )}
                      </div>

                      {/* Progress bar for training/generating */}
                      {["training", "generating"].includes(o.status) && (
                        <div className="mt-3 mb-3">
                          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                              style={{
                                width: `${
                                  o.status === "training"
                                    ? Math.max(3, trainingProgress[o.id] ?? 0)
                                    : o.status === "generating"
                                      ? 65
                                      : 0
                                }%`,
                              }}
                            />
                          </div>
                          <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold mt-1">
                            {o.status === "training"
                              ? `Training AI model... ${trainingProgress[o.id] ?? 0}%`
                              : "Generating headshots..."}
                          </p>
                        </div>
                      )}

                      {/* Status badge */}
                      <div className="flex items-center justify-between mt-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold ${
                            o.status === "completed"
                              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                              : ["training", "generating"].includes(o.status)
                                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                                : o.status === "pending"
                                  ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                          }`}
                        >
                          {o.status === "completed" ? (
                            "Gallery Ready"
                          ) : o.status === "failed" ? (
                            <>
                              <AlertCircle className="w-3 h-3" /> Failed
                            </>
                          ) : o.status === "pending" ? (
                            "Payment Pending"
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                              Processing
                            </>
                          )}
                        </span>
                      </div>
                    </Link>

                    {/* Action buttons at bottom of card */}
                    <div className="px-6 pb-4 pt-0 flex items-center gap-2 flex-wrap">
                      {o.status === "pending" && onResumeCheckout && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onResumeCheckout(o.id);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Resume
                          Checkout
                        </button>
                      )}
                      {o.status === "failed" && onRetry && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRetry(o.id);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Retry Generation
                        </button>
                      )}
                      {o.status === "completed" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/dashboard?order=${o.id}`;
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> View Gallery
                        </button>
                      )}
                      {o.status !== "pending" && (
                        <OrderCardActions
                          order={o}
                          onDelete={(id) => {
                            if (onDelete) onDelete(id);
                          }}
                          onRetry={onRetry}
                          onResumeCheckout={onResumeCheckout}
                          onCancel={onCancel}
                        />
                      )}
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
