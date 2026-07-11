"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { IconWhatsapp, IconArrowRightUp } from "@/components/icons";
import { buildWhatsAppUrl, WHATSAPP_LINK_ATTRS } from "@/lib/whatsapp";
import type { LandingProduct } from "@/lib/landingProducts";

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
    <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-foreground/10 bg-card shadow-sm transition-shadow duration-500 hover:shadow-lg dark:border-white/8">
      <button
        type="button"
        aria-label={`${displayName} — show next angle`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setView((v) => (v + 1) % product.views.length)}
        className="relative block h-64 w-full cursor-pointer overflow-hidden bg-linear-to-b from-brand-300 to-brand-200 sm:h-72 dark:from-brand-1100 dark:to-brand-1200"
      >
        {product.views.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={i === 0 ? `${displayName} inverter` : ""}
            aria-hidden={i !== 0}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="select-none object-contain p-6 transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.03]"
            style={{ opacity: i === view ? 1 : 0 }}
            draggable={false}
          />
        ))}

        <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-brand-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-brand-700 dark:text-brand-1200">
          Eligible · {product.reward}
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {product.phase}
          </span>
          <span className="text-sm text-muted-foreground">
            {product.series}
          </span>
        </div>

        <h3 className="font-display text-2xl font-bold leading-tight">
          {product.name}
          <span className="text-brand-900 dark:text-brand-600">
            {" "}
            {product.power}
          </span>
        </h3>

        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
          {product.blurb}
        </p>

        <Button
          asChild
          variant="outline"
          className="mt-2 w-full rounded-full border-brand-900/30 text-brand-1000 hover:bg-brand-900/5 hover:text-brand-1000 dark:border-brand-700/40 dark:text-brand-600 dark:hover:bg-brand-700/10 dark:hover:text-brand-600"
        >
          <a
            href={buildWhatsAppUrl({
              intent: "install-product",
              product: displayName,
              source: "product-card",
            })}
            {...WHATSAPP_LINK_ATTRS}
          >
            <IconWhatsapp fill className="mr-1.5 size-4" />
            Install this &amp; earn {product.reward}
            <IconArrowRightUp className="ml-2 size-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}
