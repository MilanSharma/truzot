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

const CARD_WIDTH = 288; // w-72
const GAP = 24; // gap-6
const CARD_STEP = CARD_WIDTH + GAP;

export default function BeforeAfterCarousel({
  examples,
}: BeforeAfterCarouselProps) {
  const [isHovered, setIsHovered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Triple the items for seamless infinite loop
  const displayExamples = [...examples, ...examples, ...examples];
  const singleSetWidth = examples.length * CARD_STEP;

  // Start at the beginning of the second set
  useEffect(() => {
    if (scrollRef.current && singleSetWidth > 0) {
      scrollRef.current.scrollLeft = singleSetWidth;
      // Infinite scroll reset
      if (
        scrollRef.current.scrollWidth > 0 &&
        scrollRef.current.scrollLeft >= scrollRef.current.scrollWidth / 2
      ) {
        scrollRef.current.scrollLeft = 0;
      }
    }
  }, [singleSetWidth]);

  // Auto-scroll with infinite loop
  useEffect(() => {
    if (!scrollRef.current || isHovered || singleSetWidth === 0) return;

    const container = scrollRef.current;
    let animationId: number;
    let lastTime = 0;
    const speed = 0.5;

    const tick = (timestamp: number) => {
      if (timestamp - lastTime > 16) {
        container.scrollLeft += speed;

        const maxScroll = container.scrollWidth - container.clientWidth;

        // Jump from end of third set back to second set (seamless)
        if (container.scrollLeft >= singleSetWidth * 2 + CARD_WIDTH) {
          container.scrollLeft -= singleSetWidth;
        }
        // Jump from start of first set forward to second set
        else if (container.scrollLeft <= singleSetWidth - CARD_WIDTH) {
          container.scrollLeft += singleSetWidth;
        }

        lastTime = timestamp;
      }
      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isHovered, singleSetWidth]);

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-hidden scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {displayExamples.map((example, index) => (
          <div key={index} className="flex-shrink-0 w-72 relative group">
            {/* Main After Image Card */}
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-lg bg-slate-100">
              <Image
                src={example.after}
                alt={`${example.name} - Professional headshot`}
                fill
                className="object-cover"
                priority={index < 3}
                sizes="(max-width: 768px) 180px, (max-width: 1024px) 200px, 240px"
              />

              {/* Before Thumbnail */}
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
