"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

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
      onMouseLeave={() => setIsHovered(false)}
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

              {/* Before Thumbnail - Top Left Corner (Black overlay removed) */}
              <div className="absolute top-3 left-3 w-16 h-16 rounded-lg overflow-hidden border-2 border-white shadow-md transition-transform duration-300 hover:scale-150 hover:z-50 relative">
                <Image
                  src={example.before}
                  alt="Before - Casual photo"
                  fill
                  className="object-cover"
                  sizes="64px"
                />
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

      {/* Gradient Overlays for Smooth Edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </div>
  );
}
