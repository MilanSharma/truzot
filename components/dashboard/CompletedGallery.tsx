"use client";
import { ImageIcon } from "lucide-react";
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

export default function CompletedGallery({
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
  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-6 mb-8">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              onCategoryChange(tab.id);
            }}
            className={`px-4 py-2.5 text-sm font-bold rounded-full transition-all duration-200 active:scale-95 ${activeCategory === tab.id ? "bg-slate-900 text-white shadow-md scale-105" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"}`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <>
          <VirtualizedHeadshotGrid
            headshots={filtered}
            favorites={favorites}
            selectedImages={selectedImages}
            multiSelectMode={multiSelectMode}
            activeCategory={activeCategory}
            orderId={orderId}
            onToggleSelect={onToggleSelect}
            onToggleFavorite={onToggleFavorite}
            onView={(url) => onView(url)}
            onDownload={onDownload}
            onFlag={onFlag}
          />
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition shadow-sm disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
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
