"use client";

import { useEffect, useState } from "react";
import PreloaderContent from "./PreloaderContent";

/**
 * Full-load splash for public routes. Unlike loading.tsx (which clears as soon
 * as the server component's data resolves), this stays until the browser's
 * `load` event — i.e. images, fonts, and hydration are done — then fades out.
 * SSR-rendered so it paints on first byte; the `boot-splash` class is hidden
 * via <noscript> so it never sticks when JS is disabled.
 */
export default function BootSplash() {
  const [done, setDone] = useState(false); // window load fired → begin fade
  const [gone, setGone] = useState(false); // fade finished → unmount

  useEffect(() => {
    const finish = () => setDone(true);
    // Defer the already-loaded case off the effect body (no synchronous
    // setState / cascading render, no SSR-hydration mismatch).
    if (document.readyState === "complete") {
      const id = requestAnimationFrame(finish);
      return () => cancelAnimationFrame(id);
    }
    window.addEventListener("load", finish);
    return () => window.removeEventListener("load", finish);
  }, []);

  // Fallback unmount in case transitionend doesn't fire (e.g. transitions off).
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setGone(true), 600);
    return () => clearTimeout(t);
  }, [done]);

  if (gone) return null;

  return (
    <div
      className={`boot-splash fixed inset-0 z-9999! flex flex-col items-center justify-center gap-8 bg-background transition-opacity duration-500 ${
        done ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-busy={!done}
      aria-label="Loading"
      onTransitionEnd={() => done && setGone(true)}
    >
      <PreloaderContent />
    </div>
  );
}
