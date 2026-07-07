"use client";

import { forwardRef } from "react";
import Image from "next/image";

export interface Testimonial {
  id: string;
  name: string;
  city: string;
  earned: string;
  videoSrc?: string;
  poster?: string;
}

const TestimonialCard = forwardRef<
  HTMLDivElement,
  { item: Testimonial; active: boolean }
>(({ item, active }, ref) => {
  return (
    <div
      ref={ref}
      data-testid={`testimonial-${item.id}`}
      className="testimonial-card relative aspect-[9/16] w-[68vw] shrink-0 overflow-hidden rounded-4xl border border-border sm:w-[300px]"
    >
      {item.videoSrc ? (
        <video
          className="absolute inset-0 size-full object-cover"
          muted
          loop
          playsInline
          preload="none"
          poster={item.poster}
        >
          <source src={item.videoSrc} />
        </video>
      ) : (
        <div aria-hidden className="absolute inset-0 bg-background">
          <Image
            src="/favicon.svg"
            alt=""
            width={200}
            height={200}
            className="absolute left-1/2 top-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.08]"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-1/3 text-center">
            <span className="rounded-full bg-background/60 px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
              Installer testimonial &middot; coming soon
            </span>
          </div>
        </div>
      )}

      <div
        className={`pointer-events-none absolute inset-0 rounded-4xl ring-2 transition-opacity duration-500 ${
          active ? "opacity-100 ring-brand-800" : "opacity-0"
        }`}
      />

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 border-t border-border">
        <div>
          <p className="text-sm font-semibold leading-tight text-brand-700">
            {item.name}
          </p>
          <p className="text-xs text-muted-foreground">{item.city}</p>
        </div>
        <span className="font-mono font-bold rounded-full bg-brand-1000/80 px-2.5 py-1 text-xs text-brand-100 leading-none">
          {item.earned}
        </span>
      </div>
    </div>
  );
});

TestimonialCard.displayName = "TestimonialCard";
export default TestimonialCard;
