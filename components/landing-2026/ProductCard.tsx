"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import { IconWhatsapp, IconArrowRightUp } from "@/components/icons";
import { buildWhatsAppUrl, WHATSAPP_LINK_ATTRS } from "@/lib/whatsapp";
import type { LandingProduct } from "@/lib/landingProducts";

interface ProductCardProps {
  product: LandingProduct;
  index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const [view, setView] = useState(0);
  const cycleTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const start = () => {
      cycleTimer.current = setInterval(() => {
        setView((v) => (v + 1) % product.views.length);
      }, 1400);
    };
    const stop = () => {
      if (cycleTimer.current) clearInterval(cycleTimer.current);
      cycleTimer.current = null;
      setView(0);
    };

    el.addEventListener("mouseenter", start);
    el.addEventListener("mouseleave", stop);
    return () => {
      el.removeEventListener("mouseenter", start);
      el.removeEventListener("mouseleave", stop);
      if (cycleTimer.current) clearInterval(cycleTimer.current);
    };
  }, [product.views.length]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (badgeRef.current) {
          gsap.to(badgeRef.current, {
            scale: 1.04,
            duration: 1.4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        }
      });
    },
    { scope: cardRef },
  );

  const displayName = `${product.name} ${product.power}`;

  return (
    <div
      ref={cardRef}
      className="product-card lp-glass flex w-[78vw] shrink-0 flex-col overflow-hidden rounded-4xl sm:w-[420px] group"
    >
      <div className="relative flex h-64 items-center justify-center overflow-hidden bg-brand-1100/30 sm:h-72">
        {product.views.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={`${displayName} — view ${i + 1}`}
            fill
            sizes="(max-width: 640px) 78vw, 420px"
            className="lp-render select-none transition-opacity duration-500 object-contain"
            style={{ opacity: i === view ? 1 : 0, objectPosition: "center" }}
            draggable={false}
          />
        ))}

        <span
          ref={badgeRef}
          className="lp-glass absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-brand-900/70 backdrop-blur-lg px-3 py-1.5 text-xs font-semibold text-brand-100"
        >
          <span className="size-1.5 rounded-full bg-brand-300" />
          Eligible &middot; {product.reward}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {String(index).padStart(2, "0")} &middot; {product.phase}
          </span>
          <span className="font-number text-sm text-muted-foreground">
            {product.series}
          </span>
        </div>

        <h3 className="font-display text-2xl font-bold leading-tight">
          {product.name}
          <span className="text-brand-800"> {product.power}</span>
        </h3>

        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
          {product.blurb}
        </p>

        <Button
          asChild
          variant="outline"
          className="mt-2 w-full border-brand-800/40 bg-transparent text-brand-800 hover:bg-brand-800/10 hover:text-brand-800 rounded-full"
        >
          <a
            href={buildWhatsAppUrl({
              intent: "install-product",
              product: displayName,
              source: "product-card",
            })}
            {...WHATSAPP_LINK_ATTRS}
          >
            <IconWhatsapp fill className="mr-1 size-4" />
            Install this &amp; earn {product.reward}
            <span className="lp-btn-icon ml-2">
              <IconArrowRightUp className="size-3.5" />
            </span>
          </a>
        </Button>
      </div>
    </div>
  );
}
