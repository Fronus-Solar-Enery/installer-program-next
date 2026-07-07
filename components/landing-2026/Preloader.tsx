"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PreloaderProps {
  onComplete?: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      setVisible(false);
      body.style.overflow = prevOverflow;
      onComplete?.();
    }, 1500);

    return () => {
      clearTimeout(timer);
      body.style.overflow = prevOverflow;
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.03] bg-brand-600/20"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.8, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              mass: 0.8,
            }}
            className="relative flex flex-col items-center gap-6"
          >
            <svg
              viewBox="0 0 1080 1080"
              className="h-[20vmin] w-[20vmin]"
              fill="none"
              aria-hidden
            >
              <path
                d="M877.896 753.39C859.009 671.995 812.004 685.296 746.483 667.273C714.682 658.526 680.979 643.128 655.961 621.325C654.464 620.021 652.138 620.524 651.292 622.321L582.133 770.63C581.031 772.982 577.71 772.902 576.644 770.533C569.826 755.522 566.523 736.072 561.088 720.242C564.056 706.024 583.753 674.012 579.331 664.304C577.992 661.38 573.834 654.826 565.219 653.822C561.317 653.373 550.781 653.047 539.999 652.967C529.217 653.047 518.681 653.373 514.779 653.822C506.163 654.826 502.006 661.38 500.667 664.304C496.244 674.003 515.941 706.024 518.989 718.542C513.475 736.072 510.172 755.522 503.371 770.48C502.287 772.911 498.966 772.99 497.865 770.63L428.706 622.321C427.86 620.524 425.534 620.013 424.037 621.325C399.019 643.136 365.316 658.535 333.515 667.273C267.985 685.296 220.989 671.995 202.102 753.39C195.83 780.425 189.029 839.736 193.566 866.084C202.084 915.459 300.657 936.997 341.875 945.832C407.485 959.892 473.614 970.066 539.99 971.247C606.375 970.066 672.504 959.892 738.105 945.832C779.332 936.997 877.905 915.459 886.414 866.084C890.951 839.736 884.15 780.416 877.878 753.39H877.896Z"
                fill="var(--color-brand-600)"
              />
              <path
                d="M746.412 312.991C740.149 298.8 719.069 302.183 716.109 297.681C716.373 232.997 676.944 170.752 618.822 143.25L605.371 225.403C600.288 240.678 578.168 240.572 576.68 223.122L594.157 129.799C594.65 120.003 579.164 110.912 570.566 109.926C563.792 109.142 551.908 108.763 539.999 108.754C528.027 108.754 516.144 109.142 509.37 109.926C500.772 110.912 485.286 120.012 485.779 129.799L503.256 223.122C501.767 240.572 479.648 240.687 474.565 225.403L461.114 143.25C402.992 170.752 363.563 232.997 363.827 297.681C360.867 302.183 339.787 298.8 333.524 312.991C325.516 331.156 333.303 350.21 354.921 350.315L539.963 349.628L725.006 350.315C746.623 350.201 754.411 331.156 746.403 312.991H746.412Z"
                fill="var(--color-brand-500)"
              />
            </svg>

            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 150,
                damping: 16,
                delay: 0.2,
              }}
              className="font-display text-sm uppercase tracking-[0.3em] text-brand-600"
            >
              Fronus Installer Program
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
