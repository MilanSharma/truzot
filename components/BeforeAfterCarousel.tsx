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
  // Double the items so the track easily spans ultrawide monitors
  const trackExamples = [...examples, ...examples];

  const Card = ({
    example,
    index,
  }: {
    example: BeforeAfterCard;
    index: number;
  }) => (
    <div className="shrink-0 w-72 relative group">
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-lg bg-slate-100 dark:bg-slate-800">
        <Image
          src={example.after}
          alt={`${example.name || "Headshot"} - Professional headshot`}
          fill
          className="object-cover"
          priority={index < 3}
          sizes="(max-width: 768px) 180px, (max-width: 1024px) 200px, 240px"
        />
        <div className="absolute top-3 left-3 w-16 h-16 rounded-lg overflow-hidden border-2 border-white shadow-md transition-transform duration-300 hover:scale-150 hover:z-50 relative">
          <Image
            src={example.before}
            alt="Before - Casual photo"
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full overflow-hidden flex group">
      {/* Track 1 - Added shrink-0 to prevent Flexbox from squishing the track */}
      <div className="flex gap-6 animate-marquee min-w-full shrink-0 group-hover:[animation-play-state:paused] pr-6">
        {trackExamples.map((example, index) => (
          <Card key={`a-${index}`} example={example} index={index} />
        ))}
      </div>

      {/* Track 2 - Exact duplicate, follows immediately after Track 1 */}
      <div
        className="flex gap-6 animate-marquee min-w-full shrink-0 group-hover:[animation-play-state:paused] pr-6"
        aria-hidden="true"
      >
        {trackExamples.map((example, index) => (
          <Card key={`b-${index}`} example={example} index={index} />
        ))}
      </div>

      {/* Gradient Fades for Smooth Entry/Exit */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[var(--bg-primary)] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[var(--bg-primary)] to-transparent pointer-events-none" />
    </div>
  );
}
