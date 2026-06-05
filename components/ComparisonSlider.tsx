"use client";
import { useState, useRef, useCallback } from "react";

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

  const handleMove = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const onMove = (ev: MouseEvent) => handleMove(ev.clientX);
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const onMove = (ev: TouchEvent) => handleMove(ev.touches[0].clientX);
    const onEnd = () => {
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
    document.addEventListener("touchmove", onMove);
    document.addEventListener("touchend", onEnd);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden select-none cursor-ew-resize bg-slate-200"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <img
          src={after}
          alt={afterLabel}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={before}
            alt={beforeLabel}
            className="absolute top-0 left-0 w-full h-full object-cover"
            style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: "none" }}
          />
        </div>
        <div
          className="absolute inset-y-0"
          style={{ left: `calc(${sliderPos}% - 1px)` }}
        >
          <div className="absolute inset-y-0 w-0.5 bg-white shadow-md" />
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-700 text-sm font-bold">
            ⟷
          </div>
        </div>
        <div className="absolute bottom-3 left-3 bg-black/50 text-white text-[11px] px-2 py-1 rounded-md">
          {beforeLabel}
        </div>
        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[11px] px-2 py-1 rounded-md">
          {afterLabel}
        </div>
      </div>
    </div>
  );
}
