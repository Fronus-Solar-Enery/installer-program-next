"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
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
  const [view, setView] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const cycleTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Physics-based tilt values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), {
    stiffness: 300,
    damping: 30,
    mass: 0.5,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 300,
    damping: 30,
    mass: 0.5,
  });

  // Image parallax — moves opposite to cursor for depth
  const imageX = useSpring(useTransform(mouseX, [-0.5, 0.5], [6, -6]), {
    stiffness: 200,
    damping: 25,
    mass: 0.4,
  });
  const imageY = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), {
    stiffness: 200,
    damping: 25,
    mass: 0.4,
  });

  // Badge scale on hover
  const badgeScale = useSpring(1, {
    stiffness: 400,
    damping: 20,
    mass: 0.3,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    badgeScale.set(1.08);
    cycleTimer.current = setInterval(() => {
      setView((v) => (v + 1) % product.views.length);
    }, 1400);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
    badgeScale.set(1);
    if (cycleTimer.current) clearInterval(cycleTimer.current);
    cycleTimer.current = null;
    setView(0);
  };

  const displayName = `${product.name} ${product.power}`;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 800,
      }}
      className="lp-glass flex h-full flex-col overflow-hidden rounded-3xl group"
    >
      <div className="relative flex h-64 items-center justify-center overflow-hidden bg-brand-1100/30 sm:h-72">
        {product.views.map((src, i) => (
          <motion.div
            key={src}
            style={{ x: imageX, y: imageY }}
            className="absolute inset-0"
          >
            <Image
              src={src}
              alt={`${displayName} — view ${i + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="select-none transition-opacity duration-500 object-contain p-4"
              style={{ opacity: i === view ? 1 : 0 }}
              draggable={false}
            />
          </motion.div>
        ))}

        <motion.span
          style={{ scale: badgeScale }}
          className="lp-glass absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-brand-900/70 backdrop-blur-lg px-3 py-1.5 text-xs font-semibold text-brand-100"
        >
          <span className="size-1.5 rounded-full bg-brand-300" />
          Eligible &middot; {product.reward}
        </motion.span>
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
            <span className="ml-2">
              <IconArrowRightUp className="size-3.5" />
            </span>
          </a>
        </Button>
      </div>
    </motion.div>
  );
}
