"use client";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import {
  ImageIcon,
  ArrowUpDown,
  Columns2,
  Columns3,
  Columns4,
} from "lucide-react";
import VirtualizedHeadshotGrid from "@/components/VirtualizedHeadshotGrid";
import type { Headshot } from "@/lib/types";

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
  onFlag?: (url: string) => void;
}

const CATEGORY_TABS = [
  { id: "all", name: "All Photos" },
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
  onFlag,
}: CompletedGalleryProps) {
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "favorites">(
    "newest",
  );
  const [gridDensity, setGridDensity] = useState<number>(3);
  const [hideSimilar, setHideSimilar] = useState(false);

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
    let result = [...filtered];
    if (sortBy === "favorites") {
      result.sort((a, b) => {
        const aFav = favorites.includes(a.image_url) ? 1 : 0;
        const bFav = favorites.includes(b.image_url) ? 1 : 0;
        return bFav - aFav || a.id.localeCompare(b.id);
      });
    } else if (sortBy === "newest") {
      result.sort((a, b) => {
        return (b.created_at || b.id).localeCompare(a.created_at || a.id);
      });
    } else {
      result.sort((a, b) => {
        return (a.created_at || a.id).localeCompare(b.created_at || b.id);
      });
    }
    return result;
  }, [filtered, sortBy, favorites]);

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

      {sortedFiltered.length > 0 ? (
        <>
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
            onFlag={onFlag}
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
            No headshots in this filter
          </h4>
          <p className="text-sm text-slate-500">
            Try toggling other categories or adding some favorites.
          </p>
        </div>
      )}
    </div>
  );
}
