"use client";
import Image from "next/image";

interface BeforeAfterCard {
  before: string;
  after: string;
  name?: string;
}

interface BeforeAfterCarouselProps {
  examples: BeforeAfterCard[];
}

export default function BeforeAfterCarousel({
  examples,
}: BeforeAfterCarouselProps) {
  // Quadruple the items to ensure the track is extremely wide and loops perfectly at 50%
  const trackExamples = [...examples, ...examples, ...examples, ...examples];

  return (
    <div className="relative w-full overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl py-12 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-[0_8px_40px_rgb(0,0,0,0.04)]">
      {/* w-max forces the container to be exactly the width of its contents, preventing flex squishing */}
      <div className="flex gap-6 w-max animate-marquee hover:[animation-play-state:paused] px-6">
        {trackExamples.map((example, index) => (
          <div key={index} className="w-[280px] shrink-0 relative group">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-lg border border-slate-200/50 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
              <Image
                src={example.after}
                alt="Professional AI headshot"
                fill
                className="object-cover"
                sizes="280px"
              />
              <div className="absolute top-4 left-4 w-16 h-16 rounded-xl overflow-hidden border-2 border-white/90 shadow-xl transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1">
                <Image
                  src={example.before}
                  alt="Original photo"
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Soft gradient edges for elegant fade-in/fade-out */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[var(--bg-primary)] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[var(--bg-primary)] to-transparent pointer-events-none" />
    </div>
  );
}
