/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";

type UseVerticalOverflowOptions = {
  observeMutations?: boolean;
  debounceMs?: number;
  watch?: any;
  /**
   * If true, the hook will add a CSS class to the element to hide horizontal scrollbars
   * instead of touching width/maxWidth inline styles (this avoids changing layout).
   * Default: true
   */
  hideHorizontalWithClass?: boolean;
  /**
   * Name of the utility class added to the element when horizontal scrolling should be hidden.
   * You can override if you have a naming convention collision.
   */
  hideClassName?: string;
};

const DEFAULT_HIDE_CLASS = "__vh_hide_horizontal_scroll";

/** ensure css rule exists once per document */
function ensureHideHorizontalCss(className: string) {
  if (typeof document === "undefined") return;
  if (document.getElementById(`style-${className}`)) return;
  const style = document.createElement("style");
  style.id = `style-${className}`;
  style.textContent = `
    .${className} {
      overflow-x: hidden !important;
      -ms-overflow-style: none; /* IE/Edge hide scrollbar */
      scrollbar-width: none; /* Firefox hide scrollbar */
    }
    .${className}::-webkit-scrollbar { display: none; } /* Chrome/Safari hide scrollbar */
  `;
  document.head.appendChild(style);
}

/**
 * Hook: useVerticalOverflow
 * - Detects vertical (Y-axis) overflow robustly (works inside portals/modal).
 * - Hides horizontal scrollbar by adding a CSS class (no width/maxWidth modifications).
 */
export function useVerticalOverflow<T extends HTMLElement = HTMLDivElement>(
  options: UseVerticalOverflowOptions = {}
) {
  const {
    observeMutations = true,
    debounceMs = 50,
    watch,
    hideHorizontalWithClass = true,
    hideClassName = DEFAULT_HIDE_CLASS,
  } = options;

  const ref = useRef<T | null>(null);
  const [hasOverflow, setHasOverflow] = useState<boolean>(false);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const cleanupTimers = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return false;
    // If el is not visible (display:none) clientHeight may be 0 -> treat as no overflow
    const clientH = el.clientHeight;
    const scrollH = el.scrollHeight;
    return clientH > 0 && scrollH > clientH;
  }, []);

  const doCheck = useCallback(() => {
    cleanupTimers();
    rafRef.current = requestAnimationFrame(() => {
      const result = measure();
      setHasOverflow(result);
    });
  }, [measure]);

  const debouncedCheck = useCallback(() => {
    cleanupTimers();
    timeoutRef.current = window.setTimeout(() => {
      doCheck();
    }, debounceMs);
  }, [doCheck, debounceMs]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (hideHorizontalWithClass) ensureHideHorizontalCss(hideClassName);

    // add class to hide horizontal scrollbar without touching width
    if (hideHorizontalWithClass) el.classList.add(hideClassName);

    // initial check after paint to allow layout settle
    doCheck();

    const ro = new ResizeObserver(debouncedCheck);
    ro.observe(el);

    el.addEventListener("scroll", debouncedCheck, { passive: true });

    let mo: MutationObserver | null = null;
    if (observeMutations) {
      mo = new MutationObserver(debouncedCheck);
      mo.observe(el, { childList: true, subtree: true, characterData: true });
    }

    window.addEventListener("resize", debouncedCheck);

    return () => {
      cleanupTimers();
      ro.disconnect();
      el.removeEventListener("scroll", debouncedCheck);
      if (mo) mo.disconnect();
      window.removeEventListener("resize", debouncedCheck);
      if (hideHorizontalWithClass) el.classList.remove(hideClassName);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ref,
    observeMutations,
    debouncedCheck,
    doCheck,
    hideHorizontalWithClass,
    hideClassName,
  ]);

  useEffect(() => {
    cleanupTimers();
    rafRef.current = requestAnimationFrame(() => {
      timeoutRef.current = window.setTimeout(() => {
        doCheck();
      }, 16);
    });
    return () => cleanupTimers();
  }, [watch, doCheck]);

  useEffect(() => {
    return () => cleanupTimers();
  }, []);

  const check = useCallback(() => {
    cleanupTimers();
    return doCheck();
  }, [doCheck]);

  return { ref, hasOverflow, check };
}

/* Usage:
const { ref, hasOverflow } = useVerticalOverflow<HTMLDivElement>({ watch: isOpen, hideHorizontalWithClass: true });
return (
  <div ref={ref} style={{ maxHeight: "60vh", overflowY: "auto" }}>
    ...content...
  </div>
);
*/
