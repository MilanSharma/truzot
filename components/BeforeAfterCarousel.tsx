"use client";
import Image from "next/image";
import { Sparkles, ShieldCheck } from "lucide-react";

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
  // Duplicate exactly once — the marquee keyframes translate by -50%,
  // i.e. exactly one full set width, which is all that's needed for a
  // mathematically seamless loop (no matter how many items there are).
  const trackExamples = [...examples, ...examples];

  return (
    <div className="relative w-full overflow-hidden rounded-[1.75rem] py-10">
      <div className="flex gap-5 w-max animate-marquee hover:[animation-play-state:paused] px-5">
        {trackExamples.map((example, index) => (
          <div key={index} className="w-[260px] shrink-0 group">
            <div
              className="relative aspect-[4/5] rounded-2xl overflow-hidden ring-1 transition-all duration-500 ease-out group-hover:-translate-y-1.5"
              style={{
                background: "var(--surface)",
                boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 12px 28px -8px rgba(15,23,42,0.12)",
              }}
            >
              {/* AFTER image — the steady-state hero shot */}
              <Image
                src={example.after}
                alt="Professional AI-generated headshot"
                fill
                className="object-cover transition-opacity duration-500 ease-out group-hover:opacity-0"
                sizes="260px"
              />
              {/* BEFORE image — crossfades in on hover to tell the story */}
              <Image
                src={example.before}
                alt="Original selfie before AI enhancement"
                fill
                className="object-cover opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
                sizes="260px"
              />

              {/* Ring overlay (kept above images, never blocks them) */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-slate-900/[0.06] pointer-events-none" />

              {/* Top-left badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm transition-opacity duration-300 group-hover:opacity-0">
                <Sparkles className="w-3 h-3 text-lime-600" />
                AI headshot
              </div>

              {/* Hover state label — tells the visitor what they're looking at */}
              <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-slate-900/85 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                Their original selfie
              </div>

              {/* Bottom caption */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent px-3.5 pb-3 pt-8">
                <div className="flex items-center gap-1.5 text-white">
                  <ShieldCheck className="w-3.5 h-3.5 text-lime-400" />
                  <span className="text-xs font-semibold">
                    {example.name ? example.name : "Real customer"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edge fades — matched to the card's own background so the loop
          reads as a seamless strip instead of cutting off hard. */}
      <div
        className="absolute left-0 top-0 bottom-0 w-20 md:w-32 pointer-events-none"
        style={{ background: "linear-gradient(to right, var(--surface2), transparent)" }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-20 md:w-32 pointer-events-none"
        style={{ background: "linear-gradient(to left, var(--surface2), transparent)" }}
      />
    </div>
  );
}