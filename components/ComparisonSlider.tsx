"use client";
import { useState, useRef, useCallback, useEffect } from "react";

interface ComparisonSliderProps {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function ComparisonSlider({
  before,
  after,
  beforeLabel = "Original",
  afterLabel = "AI Headshot",
}: ComparisonSliderProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  useEffect(() => {
    const onMove = (ev: MouseEvent) => {
      if (isDragging.current) handleMove(ev.clientX);
    };
    const onTouchMove = (ev: TouchEvent) => {
      if (isDragging.current) handleMove(ev.touches[0].clientX);
    };
    const onUp = () => {
      isDragging.current = false;
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", onUp);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onUp);
    };
  }, [handleMove]);

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden select-none cursor-ew-resize bg-slate-200 shadow-xl border border-slate-200/50 dark:border-slate-700/50"
        onMouseDown={() => {
          isDragging.current = true;
        }}
        onTouchStart={() => {
          isDragging.current = true;
        }}
      >
        {/* Background Image (After) */}
        <img
          src={after}
          alt={afterLabel}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Foreground Image (Before) clipped via performant CSS clip-path */}
        <div
          className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
          style={{
            clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
          }}
        >
          <img
            src={before}
            alt={beforeLabel}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Slider Handle */}
        <div
          className="absolute inset-y-0"
          style={{ left: `calc(${sliderPos}% - 1px)` }}
        >
          <div className="absolute inset-y-0 w-0.5 bg-white shadow-md pointer-events-none" />
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-[0_0_20px_rgba(0,0,0,0.2)] flex items-center justify-center text-slate-700 text-sm font-bold pointer-events-none">
            ⟷
          </div>
        </div>

        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-md pointer-events-none">
          {beforeLabel}
        </div>
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-md pointer-events-none">
          {afterLabel}
        </div>
      </div>
    </div>
  );
}
