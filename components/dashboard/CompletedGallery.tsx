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
  Archive,
  Trash2,
  Edit,
  FolderPlus,
  Download,
  RotateCcw,
  Plus,
  Eye,
  Heart,
  MoreVertical,
  Check,
  Star,
  Folder,
  Clock,
  Tag,
  Filter,
  X,
} from "lucide-react";
import VirtualizedHeadshotGrid from "@/components/VirtualizedHeadshotGrid";
import type { Headshot } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase/client";
import { serverSideDownload } from "@/lib/download";

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
  onArchive?: (url: string) => void;
  onRename?: (url: string, newName: string) => void;
  onRegenerate?: (url: string) => void;
  onGenerateVariations?: (url: string) => void;
  onMoveToFolder?: (url: string, folderId: string) => void;
  onCreateFolder?: (name: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onMoveToProject?: (url: string, projectId: string) => void;
  onCreateProject?: (name: string) => void;
  onClearSelection?: () => void;
}

const CATEGORY_TABS = [
  { id: "all", name: "All Photos" },
  { id: "favorites", name: "Favorites" },
  { id: "corporate", name: "Corporate" },
  { id: "casual", name: "Casual" },
  { id: "creative", name: "Creative" },
  { id: "studio", name: "Studio" },
  { id: "outdoor", name: "Outdoor" },
  { id: "archived", name: "Archived" },
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
  onArchive,
  onRename,
  onRegenerate,
  onGenerateVariations,
  onMoveToFolder,
  onCreateFolder,
  onDeleteFolder,
  onMoveToProject,
  onCreateProject,
  onClearSelection,
}: CompletedGalleryProps) {
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
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [archivedItems, setArchivedItems] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState<{
    url: string;
    type: "regenerate" | "variations";
  } | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({
    current: 0,
    total: 0,
  });

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
    let result = [...filtered];

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

    // Filter archived items
    if (!showArchived) {
      result = result.filter((h) => !archivedItems.includes(h.image_url));
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
    sortBy,
    favorites,
    hideSimilar,
    searchQuery,
    dateFilter,
    showArchived,
    archivedItems,
  ]);

  // Handle bulk actions
  const handleBulkArchive = async () => {
    if (selectedImages.length === 0) return;
    for (const url of selectedImages) {
      if (onArchive) await onArchive(url);
    }
    setArchivedItems((prev) => [...prev, ...selectedImages]);
    onClearSelection?.();
    setShowBulkActions(false);
    toast("Images archived", "success");
  };

  const handleBulkDelete = async () => {
    if (selectedImages.length === 0) return;
    if (onFlag) {
      for (const url of selectedImages) {
        await onFlag(url);
      }
    }
    onClearSelection?.();
    setShowBulkActions(false);
    toast("Images deleted", "success");
  };

  const handleBulkDownload = async () => {
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
      setShowBulkActions(false);
    }
  };

  const handleRegenerate = async (
    url: string,
    type: "regenerate" | "variations",
  ) => {
    setShowRegenerateModal({ url, type });
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    if (onCreateFolder) await onCreateFolder(folderName);
    setFolderName("");
    setShowFolderModal(false);
    toast("Folder created", "success");
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    if (onCreateProject) await onCreateProject(projectName);
    setProjectName("");
    setShowProjectModal(false);
    toast("Project created", "success");
  };

  const handleRegenerateConfirm = async () => {
    if (!showRegenerateModal) return;
    const { url, type } = showRegenerateModal;
    if (type === "regenerate" && onRegenerate) {
      await onRegenerate(url);
    } else if (type === "variations" && onGenerateVariations) {
      await onGenerateVariations(url);
    }
    setShowRegenerateModal(null);
    toast("Regeneration started", "success");
  };

  const handleArchiveToggle = () => {
    setShowArchived((prev) => !prev);
  };

  const handleBulkActionToggle = () => {
    setShowBulkActions((prev) => !prev);
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
            onClick={handleArchiveToggle}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition ${showArchived ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            <Archive className="w-4 h-4" />
            {showArchived ? "Show Active" : "Archived"}
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
        <div className="flex items-center gap-2">
          {multiSelectMode && selectedImages.length > 0 && (
            <div className="relative flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {selectedImages.length} selected
              </span>
              <button
                onClick={handleBulkActionToggle}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                <Check className="w-3.5 h-3.5" />
                Actions
              </button>
              {showBulkActions && (
                <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-2 w-44">
                  <button
                    onClick={handleBulkArchive}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-50 rounded-lg"
                  >
                    <Archive className="w-4 h-4" /> Archive All
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-50 rounded-lg text-red-600"
                  >
                    <Trash2 className="w-4 h-4" /> Delete All
                  </button>
                  <button
                    onClick={handleBulkDownload}
                    disabled={downloading}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-50 rounded-lg"
                  >
                    <Download className="w-4 h-4" />{" "}
                    {downloading
                      ? `Downloading ${downloadProgress.current}/${downloadProgress.total}`
                      : "Download All"}
                  </button>
                  <button
                    onClick={() => setShowFolderModal(true)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-50 rounded-lg"
                  >
                    <FolderPlus className="w-4 h-4" /> Move to Folder
                  </button>
                  <button
                    onClick={() => setShowProjectModal(true)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-50 rounded-lg"
                  >
                    <Plus className="w-4 h-4" /> Add to Project
                  </button>
                </div>
              )}
            </div>
          )}
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
            {searchQuery || dateFilter.from || dateFilter.to || showArchived
              ? "No matching headshots"
              : "No headshots yet"}
          </h4>
          <p className="text-sm text-slate-500">
            {searchQuery
              ? "Try a different search term."
              : showArchived
                ? "No archived headshots."
                : "Try toggling other categories or adding some favorites."}
          </p>
        </div>
      )}

      {showFolderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-96">
            <h3 className="text-lg font-bold mb-4">New Folder</h3>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowFolderModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showProjectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-96">
            <h3 className="text-lg font-bold mb-4">New Project</h3>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowProjectModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showRegenerateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-96">
            <h3 className="text-lg font-bold mb-4">
              {showRegenerateModal.type === "regenerate"
                ? "Regenerate Headshot"
                : "Generate Variations"}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {showRegenerateModal.type === "regenerate"
                ? "This will regenerate the selected headshot with a new style."
                : "This will generate new variations of this headshot."}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRegenerateModal(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerateConfirm}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {downloading && (
        <div className="fixed bottom-6 right-6 bg-white border border-slate-200 rounded-xl shadow-xl p-4 w-72 z-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-700">
              Downloading...
            </span>
            <span className="text-xs text-slate-500">
              {downloadProgress.current}/{downloadProgress.total}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(downloadProgress.current / downloadProgress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
