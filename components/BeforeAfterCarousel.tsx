"use client";
import { useState, useCallback } from "react";
import ComparisonSlider from "./ComparisonSlider";

interface BeforeAfterPair {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  caption?: string;
}

interface BeforeAfterCarouselProps {
  pairs: Array<{
    before: string;
    after: string;
    beforeLabel?: string;
    afterLabel?: string;
    caption?: string;
  }>;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export default function BeforeAfterCarousel({
  pairs,
  autoPlay = false,
  autoPlayInterval = 5000,
}: BeforeAfterCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % pairs.length);
  }, [pairs.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + pairs.length) % pairs.length);
  }, [pairs.length]);

  const currentPair = pairs[currentIndex];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative">
        <ComparisonSlider
          before={currentPair.before}
          after={currentPair.after}
          beforeLabel={currentPair.beforeLabel}
          afterLabel={currentPair.afterLabel}
        />

        {currentPair.caption && (
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            {currentPair.caption}
          </p>
        )}

        {pairs.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-12 h-12 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-lg flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 hover:shadow-xl z-10"
              aria-label="Previous"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-12 h-12 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-lg flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 hover:shadow-xl z-10"
              aria-label="Next"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {pairs.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {pairs.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? "bg-blue-600 dark:bg-blue-400 w-8"
                    : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
