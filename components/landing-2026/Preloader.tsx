"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { EASE_ENTER, EASE_MOVE } from "@/lib/gsapEases";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

interface PreloaderProps {
  /** Notified once the reveal animation completes and the overlay is unmounted. */
  onComplete?: () => void;
}

/**
 * Preloader — "Wired Helmet".
 *
 * Traces the brand hardhat (favicon.svg) via stroke-dashoffset, fills it, then
 * wipes the whole overlay away with a clipPath reveal so the page beneath is
 * "powered on". Respects prefers-reduced-motion (instant reveal). Locks body
 * scroll for the duration; the parent (LandingPage2026) owns Lenis stop/start.
 *
 * The two helmet paths below are lifted verbatim from /public/favicon.svg:
 *  - body  : the dark slate hardhat shell
 *  - strap : the teal chin-strap (brand accent), drawn in last
 */
export default function Preloader({ onComplete }: PreloaderProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const bodyPathRef = useRef<SVGPathElement>(null);
  const strapPathRef = useRef<SVGPathElement>(null);
  const wordmarkRef = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const body = document.body;

      // Lock scroll while the preloader is up.
      const prevOverflow = body.style.overflow;
      body.style.overflow = "hidden";

      const finish = () => {
        body.style.overflow = prevOverflow;
        setDone(true);
        onComplete?.();
      };

      // Reduced motion: skip the ceremony.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.delayedCall(0.2, finish);
        return;
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          onComplete: finish,
          defaults: { ease: EASE_ENTER },
        });

        // --- Phase 1: draw the helmet wireframe ---
        if (bodyPathRef.current && strapPathRef.current) {
          const bodyLen = bodyPathRef.current.getTotalLength();
          const strapLen = strapPathRef.current.getTotalLength();
          gsap.set(bodyPathRef.current, {
            strokeDasharray: bodyLen,
            strokeDashoffset: bodyLen,
            fill: "transparent",
            stroke: "var(--color-brand-600)",
            opacity: 1,
          });
          gsap.set(strapPathRef.current, {
            strokeDasharray: strapLen,
            strokeDashoffset: strapLen,
            fill: "transparent",
            stroke: "var(--color-brand-500)",
            opacity: 1,
          });

          tl.to(bodyPathRef.current, {
            strokeDashoffset: 0,
            duration: 0.9,
            ease: EASE_MOVE,
          })
            .to(
              strapPathRef.current,
              {
                strokeDashoffset: 0,
                duration: 0.45,
                ease: EASE_MOVE,
              },
              "-=0.25",
            )
            // --- Phase 2: fill the helmet ---
            .to(
              [bodyPathRef.current, strapPathRef.current],
              {
                fill: "var(--color-brand-600)",
                stroke: "var(--color-brand-600)",
                duration: 0.35,
              },
              "-=0.1",
            );
        }

        // Wordmark rises with the fill.
        if (wordmarkRef.current) {
          tl.fromTo(
            wordmarkRef.current,
            { autoAlpha: 0, y: 14, filter: "blur(8px)" },
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.5,
              ease: EASE_ENTER,
            },
            "-=0.25",
          );
        }

        // --- Phase 3: hold briefly, then power-on reveal ---
        tl.to({}, { duration: 0.2 })
          .to(overlayRef.current, {
            clipPath: "inset(0 0 100% 0)", // wipe upward from bottom
            duration: 0.7,
            ease: EASE_MOVE,
          })
          .set(overlayRef.current, { autoAlpha: 0 });
      });
    },
    { scope: overlayRef },
  );

  if (done) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      style={{ clipPath: "inset(0 0 0 0)" }}
    >
      <div aria-hidden className="absolute inset-0 opacity-[0.04] bg-brand-700/20" />
      <svg
        viewBox="0 0 1080 1080"
        className="relative h-[24vmin] w-[24vmin]"
        fill="none"
        aria-hidden
      >
        {/* Helmet body — exact path from favicon.svg */}
        <path
          ref={bodyPathRef}
          d="M877.896 753.39C859.009 671.995 812.004 685.296 746.483 667.273C714.682 658.526 680.979 643.128 655.961 621.325C654.464 620.021 652.138 620.524 651.292 622.321L582.133 770.63C581.031 772.982 577.71 772.902 576.644 770.533C569.826 755.522 566.523 736.072 561.088 720.242C564.056 706.024 583.753 674.012 579.331 664.304C577.992 661.38 573.834 654.826 565.219 653.822C561.317 653.373 550.781 653.047 539.999 652.967C529.217 653.047 518.681 653.373 514.779 653.822C506.163 654.826 502.006 661.38 500.667 664.304C496.244 674.003 515.941 706.024 518.989 718.542C513.475 736.072 510.172 755.522 503.371 770.48C502.287 772.911 498.966 772.99 497.865 770.63L428.706 622.321C427.86 620.524 425.534 620.013 424.037 621.325C399.019 643.136 365.316 658.535 333.515 667.273C267.985 685.296 220.989 671.995 202.102 753.39C195.83 780.425 189.029 839.736 193.566 866.084C202.084 915.459 300.657 936.997 341.875 945.832C407.485 959.892 473.614 970.066 539.99 971.247C606.375 970.066 672.504 959.892 738.105 945.832C779.332 936.997 877.905 915.459 886.414 866.084C890.951 839.736 884.15 780.416 877.878 753.39H877.896Z"
          strokeWidth={20}
          strokeLinejoin="round"
        />
        {/* Helmet strap — exact path from favicon.svg (teal accent) */}
        <path
          ref={strapPathRef}
          d="M746.412 312.991C740.149 298.8 719.069 302.183 716.109 297.681C716.373 232.997 676.944 170.752 618.822 143.25L605.371 225.403C600.288 240.678 578.168 240.572 576.68 223.122L594.157 129.799C594.65 120.003 579.164 110.912 570.566 109.926C563.792 109.142 551.908 108.763 539.999 108.754C528.027 108.754 516.144 109.142 509.37 109.926C500.772 110.912 485.286 120.012 485.779 129.799L503.256 223.122C501.767 240.572 479.648 240.687 474.565 225.403L461.114 143.25C402.992 170.752 363.563 232.997 363.827 297.681C360.867 302.183 339.787 298.8 333.524 312.991C325.516 331.156 333.303 350.21 354.921 350.315L539.963 349.628L725.006 350.315C746.623 350.201 754.411 331.156 746.403 312.991H746.412Z"
          strokeWidth={20}
          strokeLinejoin="round"
        />
      </svg>

      <span
        ref={wordmarkRef}
        className="mt-6 font-display text-sm uppercase tracking-[0.3em] text-brand-600"
      >
        Fronus Installer Program
      </span>
    </div>
  );
}
