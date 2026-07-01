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

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!e.buttons) return; // Only trigger if pointer is down
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden select-none cursor-ew-resize bg-[var(--surface2)] border border-[var(--border)] touch-none"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handlePointerMove(e); }}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
      >
        <img src={after} alt={afterLabel} className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} />

        <div
          className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
          style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
        >
          <img src={before} alt={beforeLabel} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        </div>

        <div className="absolute inset-y-0" style={{ left: `calc(${sliderPos}% - 1px)` }}>
          <div className="absolute inset-y-0 w-0.5 bg-[var(--lime)] shadow-[var(--shadow-lime)] pointer-events-none" />
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[var(--lime)] border-4 border-[var(--bg)] shadow-[var(--shadow-lime)] flex items-center justify-center text-black text-sm font-bold pointer-events-none">
            ⟷
          </div>
        </div>

        <div className="absolute bottom-3 left-3 bg-[var(--bg)]/70 backdrop-blur-sm text-[var(--text-faint)] text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md pointer-events-none">
          {beforeLabel}
        </div>
        <div className="absolute bottom-3 right-3 bg-[var(--bg)]/70 backdrop-blur-sm text-[var(--text-faint)] text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md pointer-events-none">
          {afterLabel}
        </div>
      </div>
    </div>
  );
}
