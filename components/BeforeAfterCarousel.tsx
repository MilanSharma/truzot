"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeAfterCard {
  before: string;
  after: string;
  name: string;
  profession: string;
}

interface BeforeAfterCarouselProps {
  examples: BeforeAfterCard[];
}

export default function BeforeAfterCarousel({
  examples,
}: BeforeAfterCarouselProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll functionality
  useEffect(() => {
    if (!scrollRef.current || isHovered) return;

    const scrollContainer = scrollRef.current;
    let animationId: number;
    let lastTime = 0;
    const scrollSpeed = 0.5; // pixels per frame

    const scroll = (timestamp: number) => {
      if (timestamp - lastTime > 16) {
        // ~60fps
        scrollContainer.scrollLeft += scrollSpeed;

        // Reset to start when reaching end
        if (
          scrollContainer.scrollLeft >=
          scrollContainer.scrollWidth - scrollContainer.clientWidth
        ) {
          scrollContainer.scrollLeft = 0;
        }
        lastTime = timestamp;
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isHovered]);

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setEnlargedImage(null);
      }}
    >
      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {examples.map((example, index) => (
          <div key={index} className="flex-shrink-0 w-72 relative group">
            {/* Main After Image Card */}
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-lg bg-slate-100">
              <Image
                src={example.after}
                alt={`${example.name} - Professional headshot`}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="(max-width: 768px) 180px, (max-width: 1024px) 200px, 240px"
              />

              {/* Before Thumbnail - Top Left Corner */}
              <div
                className="absolute top-3 left-3 w-16 h-16 rounded-lg overflow-hidden border-2 border-white shadow-md cursor-pointer transition-transform duration-300 hover:scale-150 hover:z-50 relative"
                onMouseEnter={() => setEnlargedImage(example.before)}
                onMouseLeave={() => setEnlargedImage(null)}
              >
                <Image
                  src={example.before}
                  alt="Before - Casual photo"
                  fill
                  className="object-cover"
                  sizes="64px"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">
                    BEFORE
                  </span>
                </div>
              </div>

              {/* Profession Badge */}
              <div className="absolute bottom-3 left-3 right-3">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                  <p className="text-sm font-bold text-slate-900">
                    {example.name}
                  </p>
                  <p className="text-xs text-slate-600">{example.profession}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enlarged Before Image Modal */}
      <AnimatePresence>
        {enlargedImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setEnlargedImage(null)}
          >
            <div className="relative max-w-2xl w-full">
              <Image
                src={enlargedImage}
                alt="Enlarged before photo"
                fill
                sizes="90vw"
                className="object-contain rounded-2xl shadow-2xl"
              />
              <button
                onClick={() => setEnlargedImage(null)}
                className="absolute -top-12 right-0 text-white hover:text-slate-300 transition"
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gradient Overlays for Smooth Edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </div>
  );
}
