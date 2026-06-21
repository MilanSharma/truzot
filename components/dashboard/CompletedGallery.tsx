"use client";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import {
  ImageIcon,
  ArrowUpDown,
  Columns2,
  Columns3,
  Columns4,
  Search,
  Calendar,
  Download,
  X,
  Sparkles,
} from "lucide-react";
import VirtualizedHeadshotGrid from "@/components/VirtualizedHeadshotGrid";
import type { Headshot } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase/client";
import { serverSideDownload } from "@/lib/download";
import CustomUpsellModal from "./CustomUpsellModal";

interface CompletedGalleryProps {
  headshots: Headshot[];
  filtered: Headshot[];
  activeCategory: string;
  orderId?: string;
  favorites: string[];
  selectedImages: string[];
  multiSelectMode: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onCategoryChange: (cat: string) => void;
  onToggleSelect: (url: string, e?: React.MouseEvent) => void;
  onToggleFavorite: (url: string, e?: React.MouseEvent) => void;
  onView: (url: string) => void;
  onDownload: (url: string) => void;
  onClearSelection?: () => void;
}

const CATEGORY_TABS = [
  { id: "all", name: "All Photos" },
  { id: "best", name: "Best Headshots" },
  { id: "favorites", name: "Favorites" },
  { id: "corporate", name: "Corporate" },
  { id: "casual", name: "Casual" },
  { id: "creative", name: "Creative" },
  { id: "studio", name: "Studio" },
  { id: "outdoor", name: "Outdoor" },
];

const GRID_DENSITIES = [
  { cols: 2, label: "2", icon: Columns2, minWidth: 340 },
  { cols: 3, label: "3", icon: Columns3, minWidth: 250 },
  { cols: 4, label: "4", icon: Columns4, minWidth: 200 },
] as const;

interface DateFilter {
  from: Date | null;
  to: Date | null;
}

const SkeletonCard = () => (
  <div className="aspect-[3/4] rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse">
    <div className="h-full w-full rounded-xl bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 animate-shimmer" />
  </div>
);

export default function CompletedGallery({
  headshots,
  filtered,
  activeCategory,
  orderId,
  favorites,
  selectedImages,
  multiSelectMode,
  hasMore,
  loadingMore,
  onLoadMore,
  onCategoryChange,
  onToggleSelect,
  onToggleFavorite,
  onView,
  onDownload,
  onClearSelection,
}: CompletedGalleryProps) {
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "favorites">(
    "newest",
  );
  const [gridDensity, setGridDensity] = useState<number>(3);
  const [hideSimilar, setHideSimilar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    from: null,
    to: null,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const { toast } = useToast();

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, onLoadMore]);

  const sortedFiltered = useMemo(() => {
    // When "best" tab is active, sort favorites to top
    const base =
      activeCategory === "best"
        ? [...filtered].sort((a, b) => {
            const aFav = favorites.includes(a.image_url) ? 1 : 0;
            const bFav = favorites.includes(b.image_url) ? 1 : 0;
            return bFav - aFav;
          })
        : filtered;

    let result = [...base];

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((h) => {
        const style = (h.style || "").toLowerCase();
        const category = (h.category || "").toLowerCase();
        return style.includes(q) || category.includes(q);
      });
    }

    // Apply date filter
    if (dateFilter.from || dateFilter.to) {
      result = result.filter((h) => {
        if (!h.created_at) return false;
        const created = new Date(h.created_at).getTime();
        if (dateFilter.from && created < dateFilter.from.getTime())
          return false;
        if (dateFilter.to && created > dateFilter.to.getTime()) return false;
        return true;
      });
    }

    const originalIndex = new Map(result.map((h, i) => [h.image_url, i]));

    if (hideSimilar) {
      const seen = new Set<string>();
      result = result.filter((h) => {
        const key = h.category || h.style || "unknown";
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    if (sortBy === "favorites") {
      result.sort((a, b) => {
        const aFav = favorites.includes(a.image_url) ? 1 : 0;
        const bFav = favorites.includes(b.image_url) ? 1 : 0;
        return (
          bFav - aFav ||
          (originalIndex.get(a.image_url) ?? 0) -
            (originalIndex.get(b.image_url) ?? 0)
        );
      });
    } else if (sortBy === "newest") {
      result.sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return (
          bTime - aTime ||
          (originalIndex.get(a.image_url) ?? 0) -
            (originalIndex.get(b.image_url) ?? 0)
        );
      });
    } else {
      result.sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return (
          aTime - bTime ||
          (originalIndex.get(a.image_url) ?? 0) -
            (originalIndex.get(b.image_url) ?? 0)
        );
      });
    }
    return result;
  }, [
    filtered,
    activeCategory,
    sortBy,
    favorites,
    hideSimilar,
    searchQuery,
    dateFilter,
  ]);

  // Handle bulk actions

  const handleDownloadAll = async () => {
    if (!orderId || sortedFiltered.length === 0) return;
    setDownloadingAll(true);
    try {
      const allUrls = sortedFiltered.map((h) => h.image_url);
      await serverSideDownload(
        allUrls,
        orderId,
        `truzot-all-${sortedFiltered.length}.zip`,
        () => {},
      );
      toast("Download started", "success");
    } catch {
      toast("Failed to download all. Please try again.", "error");
    } finally {
      setDownloadingAll(false);
    }
  };
  const handleDateFilterChange = (from: Date | null, to: Date | null) => {
    setDateFilter({ from, to });
    setShowDatePicker(false);
  };

  const clearDateFilter = () => {
    setDateFilter({ from: null, to: null });
  };

  const gridMinWidth =
    GRID_DENSITIES.find((d) => d.cols === gridDensity)?.minWidth ?? 250;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-6 mb-6">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onCategoryChange(tab.id)}
              className={`px-4 py-2.5 text-sm font-bold rounded-full transition-all duration-200 active:scale-95 ${activeCategory === tab.id ? "bg-slate-900 text-white shadow-md scale-105" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"}`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search style or category..."
              className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-56"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition ${dateFilter.from || dateFilter.to ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              <Calendar className="w-4 h-4" />
              {dateFilter.from || dateFilter.to
                ? `${dateFilter.from?.toLocaleDateString() ?? "..."} - ${dateFilter.to?.toLocaleDateString() ?? "..."}`
                : "Date"}
              {(dateFilter.from || dateFilter.to) && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    clearDateFilter();
                  }}
                >
                  <X className="w-3.5 h-3.5 ml-1" />
                </span>
              )}
            </button>
            {showDatePicker && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-4 w-72">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-slate-500">
                    From
                  </label>
                  <input
                    type="date"
                    value={
                      dateFilter.from
                        ? dateFilter.from.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setDateFilter((prev) => ({
                        ...prev,
                        from: e.target.value ? new Date(e.target.value) : null,
                      }))
                    }
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg"
                  />
                  <label className="text-xs font-medium text-slate-500">
                    To
                  </label>
                  <input
                    type="date"
                    value={
                      dateFilter.to
                        ? dateFilter.to.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setDateFilter((prev) => ({
                        ...prev,
                        to: e.target.value ? new Date(e.target.value) : null,
                      }))
                    }
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setShowDatePicker(false);
                      }}
                      className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleDownloadAll}
            disabled={downloadingAll}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloadingAll
              ? "Downloading..."
              : `Download All (${sortedFiltered.length})`}
          </button>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          {GRID_DENSITIES.map((d) => {
            const Icon = d.icon;
            return (
              <button
                key={d.cols}
                onClick={() => setGridDensity(d.cols)}
                className={`p-1.5 rounded-md transition ${
                  gridDensity === d.cols
                    ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
                title={`${d.label} columns`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="favorites">Favorites First</option>
            </select>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideSimilar}
              onChange={(e) => setHideSimilar(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Hide similar
          </label>
          <span className="text-slate-400">{sortedFiltered.length} photos</span>
        </div>
      </div>

      {sortedFiltered.length > 0 ? (
        <>
          <div className="mb-10 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-2xl group border border-white/10">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"></div>
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-500 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                  Unlock Custom Styles
                </h3>
                <p className="text-indigo-100/70 max-w-xl text-sm leading-relaxed">
                  Your AI model is already trained! Didn&apos;t get the exact
                  look you wanted? Generate 20 custom headshots with your exact
                  choice of clothing and background.
                </p>
              </div>
              <button
                onClick={() => setShowUpsellModal(true)}
                className="shrink-0 px-8 py-3.5 bg-white text-indigo-950 rounded-xl font-bold hover:bg-indigo-50 transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center gap-2"
              >
                Create Custom Pack ($14)
              </button>
            </div>
          </div>
          <VirtualizedHeadshotGrid
            headshots={sortedFiltered}
            favorites={favorites}
            selectedImages={selectedImages}
            multiSelectMode={multiSelectMode}
            orderId={orderId}
            minColWidth={gridMinWidth}
            onToggleSelect={onToggleSelect}
            onToggleFavorite={onToggleFavorite}
            onView={(url) => onView(url)}
            onDownload={onDownload}
          />
          {hasMore && <div ref={sentinelRef} className="h-10 w-full" />}
          {loadingMore && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-slate-900 mb-2">
            {searchQuery || dateFilter.from || dateFilter.to
              ? "No matching headshots"
              : "No headshots yet"}
          </h4>
          <p className="text-sm text-slate-500">
            {searchQuery
              ? "Try a different search term."
              : "Try toggling other categories or adding some favorites."}
          </p>
        </div>
      )}

      {showUpsellModal && (
        <CustomUpsellModal
          orderId={orderId || ""}
          onClose={() => setShowUpsellModal(false)}
        />
      )}
    </div>
  );
}
