"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { IconWhatsapp, IconArrowRightUp } from "@/components/icons";
import { buildWhatsAppUrl, WHATSAPP_LINK_ATTRS } from "@/lib/whatsapp";
import type { LandingProduct } from "@/lib/landingProducts";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: LandingProduct;
}

/**
 * Hover (desktop) cycles through the render angles; tapping the image does
 * the same on touch. Deliberately no 3D-tilt physics — the audience is on
 * low-end Android and the crossfade alone carries the "real product" story.
 */
export default function ProductCard({ product }: ProductCardProps) {
  const [view, setView] = useState(0);
  const cycleTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCycle = () => {
    if (cycleTimer.current) clearInterval(cycleTimer.current);
    cycleTimer.current = null;
  };

  const handleMouseEnter = () => {
    stopCycle();
    cycleTimer.current = setInterval(() => {
      setView((v) => (v + 1) % product.views.length);
    }, 1400);
  };

  const handleMouseLeave = () => {
    stopCycle();
    setView(0);
  };

  useEffect(() => stopCycle, []);

  const displayName = `${product.name} ${product.power}`;

  return (
    <div className="relative group flex h-[450px] flex-col overflow-hidden">
      <button
        type="button"
        aria-label={`${displayName} — show next angle`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setView((v) => (v + 1) % product.views.length)}
        className="relative block squircle rounded-4xl size-full cursor-pointer overflow-hidden bg-linear-to-b from-brand-300 to-brand-300 dark:from-brand-1100 dark:to-brand-1100/20"
      >
        {product.views.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={i === 0 ? `${displayName} inverter` : ""}
            aria-hidden={i !== 0}
            fill
            loading="eager"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="px-10 pb-20 pt-0 select-none object-contain transition-all duration-500 ease-out group-hover:scale-[1.03]"
            style={{ opacity: i === view ? 1 : 0 }}
            draggable={false}
          />
        ))}

        <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-brand-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-brand-700 dark:text-brand-1200">
          Eligible · {product.reward}
        </span>
      </button>

      <ProgressiveBlur
        className="pointer-events-none absolute bottom-0 left-0 h-[50%] w-full rounded-4xl squircle"
        blurIntensity={40}
      />
      <div className="flex flex-1 flex-col gap-3 p-6 absolute bottom-0 left-0 right-0 z-1">
        <span className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground w-max">
          {product.phase}
        </span>

        <h3 className="font-display text-2xl font-bold leading-tight">
          {product.name}  {product.power}
        </h3>

        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
          {product.blurb}
        </p>
      </div>
    </div>
  );
}

interface ProgressiveBlurProps {
  className?: string;
  blurIntensity?: number;
}
function ProgressiveBlur({
  className = "",
  blurIntensity = 10,
}: ProgressiveBlurProps) {
  return (
    <div
      className={cn(className)}
      style={{
        backdropFilter: `blur(${blurIntensity}px)`,
        WebkitBackdropFilter: `blur(${blurIntensity}px)`,
        mask: "linear-gradient(to top, black 0%, black 60%, rgba(0,0,0,0.95) 65%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,0.8) 75%, rgba(0,0,0,0.6) 80%, rgba(0,0,0,0.4) 85%, rgba(0,0,0,0.2) 90%, rgba(0,0,0,0.1) 95%, transparent 100%)",
        WebkitMask:
          "linear-gradient(to top, black 0%, black 60%, rgba(0,0,0,0.95) 65%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,0.8) 75%, rgba(0,0,0,0.6) 80%, rgba(0,0,0,0.4) 85%, rgba(0,0,0,0.2) 90%, rgba(0,0,0,0.1) 95%, transparent 100%)",
      }}
    />
  );
}
