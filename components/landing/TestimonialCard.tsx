"use client";

import ProgramLogo from "@/components/ProgramLogo";

export interface Testimonial {
  id: string;
  /** Filled in once real clips exist — the card is video-ready. */
  name?: string;
  city?: string;
  videoSrc?: string;
  poster?: string;
}

/**
 * Vertical 9:16 story frame. Real installer clips drop into the same frame
 * later (videoSrc + poster) with no layout change; until then the card is an
 * honest "coming soon" placeholder — no invented people, no invented numbers.
 */
export default function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <div className="relative aspect-9/16 w-60 shrink-0 snap-center overflow-hidden rounded-3xl border border-foreground/10 bg-linear-to-b from-brand-200 to-brand-300 sm:w-65 dark:border-white/8 dark:from-brand-1100 dark:to-brand-1200">
      {item.videoSrc ? (
        <>
          <video
            className="absolute inset-0 size-full object-cover"
            controls
            playsInline
            preload="none"
            poster={item.poster}
          >
            <source src={item.videoSrc} />
          </video>
          {(item.name || item.city) && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent p-4 pt-10">
              <p className="text-sm font-semibold text-white">{item.name}</p>
              <p className="text-xs text-white/80">{item.city}</p>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <ProgramLogo className="m-0 h-10! w-24 opacity-40" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Installer story
            <br />
            coming soon
          </p>
        </div>
      )}
    </div>
  );
}
