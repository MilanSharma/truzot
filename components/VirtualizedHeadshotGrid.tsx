"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { Grid } from "react-window";
import {
  Download,
  Heart,
  Maximize2,
  Square,
  CheckSquare,
  Flag,
} from "lucide-react";

interface Headshot {
  id: string;
  image_url: string;
  style?: string;
  category?: string;
}

interface VirtualizedHeadshotGridProps {
  headshots: Headshot[];
  favorites: string[];
  selectedImages: string[];
  multiSelectMode: boolean;
  activeCategory: string;
  orderId?: string;
  onToggleSelect: (url: string, e?: React.MouseEvent) => void;
  onToggleFavorite: (url: string, e?: React.MouseEvent) => void;
  onView: (url: string) => void;
  onDownload: (url: string) => void;
  onFlag?: (url: string) => void;
}

const CARD_ASPECT = 3 / 4;
const GAP = 24;
const MIN_COL_WIDTH = 200;
const MAX_VISIBLE_ROWS = 6;

function HeadshotCard({
  headshot,
  isFav,
  isSel,
  multiSelectMode,
  style,
  orderId,
  onToggleSelect,
  onToggleFavorite,
  onView,
  onDownload,
  onFlag,
}: {
  headshot: Headshot;
  isFav: boolean;
  isSel: boolean;
  multiSelectMode: boolean;
  style: React.CSSProperties;
  orderId?: string;
  onToggleSelect: (url: string, e?: React.MouseEvent) => void;
  onToggleFavorite: (url: string, e?: React.MouseEvent) => void;
  onView: (url: string) => void;
  onDownload: (url: string) => void;
  onFlag?: (url: string) => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={style} className="p-3">
      <div
        className={`group relative w-full h-full rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 transition-all duration-300 shadow-sm border-4 ${isSel ? "border-blue-600 ring-4 ring-blue-100" : "border-transparent"}`}
      >
        {!loaded && (
          <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse" />
        )}
        <img
          src={headshot.image_url}
          alt="AI Headshot"
          className={`w-full h-full object-cover select-none transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          onDoubleClick={() => onToggleSelect(headshot.image_url)}
          onLoad={() => setLoaded(true)}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/40 opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-between p-3">
          <div className="flex items-center justify-between">
            {multiSelectMode ? (
              <button
                onClick={(e) => onToggleSelect(headshot.image_url, e)}
                className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm"
              >
                {isSel ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
              </button>
            ) : (
              <button
                onClick={(e) => onToggleSelect(headshot.image_url, e)}
                className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-white/40 backdrop-blur-sm"
              >
                {isSel ? (
                  <CheckSquare className="w-4 h-4 text-white" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              onClick={(e) => onToggleFavorite(headshot.image_url, e)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition backdrop-blur-sm ${isFav ? "bg-rose-500 text-white" : "bg-white/20 text-white hover:bg-white/40"}`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-white" : ""}`} />
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onView(headshot.image_url)}
              className="flex-1 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDownload(headshot.image_url)}
              className="w-9 h-9 bg-white hover:bg-slate-100 text-slate-900 rounded-lg flex items-center justify-center transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            {onFlag && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFlag(headshot.image_url);
                }}
                className="w-7 h-7 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-lg flex items-center justify-center transition"
                title="Flag for regeneration"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        {isFav && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm group-hover:opacity-0 transition pointer-events-none">
            <Heart className="w-3 h-3 fill-white" />
          </div>
        )}
        {isSel && (
          <div className="absolute top-2 left-2 w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:opacity-0 transition pointer-events-none">
            <CheckSquare className="w-3 h-3 fill-white text-blue-600" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function VirtualizedHeadshotGrid(
  props: VirtualizedHeadshotGridProps,
) {
  const containerRef = useRef<HTMLDivElement>(null!);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const columnCount = Math.max(
    1,
    Math.floor((width + GAP) / (MIN_COL_WIDTH + GAP)),
  );
  const columnWidth = Math.floor(
    (width - GAP * (columnCount - 1)) / columnCount,
  );
  const rowHeight = Math.floor(columnWidth / CARD_ASPECT + GAP);
  const rowCount = Math.ceil(props.headshots.length / columnCount);
  const visibleRows = Math.min(rowCount, MAX_VISIBLE_ROWS);
  const containerHeight = Math.max(400, visibleRows * rowHeight);

  const Cell = ({
    columnIndex,
    rowIndex,
    style,
  }: {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
  }) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= props.headshots.length) return null;
    const h = props.headshots[index];
    return (
      <HeadshotCard
        headshot={h}
        isFav={props.favorites.includes(h.image_url)}
        isSel={props.selectedImages.includes(h.image_url)}
        multiSelectMode={props.multiSelectMode}
        style={style}
        orderId={props.orderId}
        onToggleSelect={props.onToggleSelect}
        onToggleFavorite={props.onToggleFavorite}
        onView={props.onView}
        onDownload={props.onDownload}
        onFlag={props.onFlag}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ height: containerHeight }}
    >
      <Grid
        columnCount={columnCount}
        columnWidth={columnWidth}
        rowCount={rowCount}
        rowHeight={rowHeight}
        style={{ height: containerHeight, width }}
        cellComponent={Cell as any}
        cellProps={{}}
      />
    </div>
  );
}
