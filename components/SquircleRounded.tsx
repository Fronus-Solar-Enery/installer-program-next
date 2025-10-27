import React, { useEffect } from "react";

/**
 * Mount this once (e.g. in App.tsx) to automatically find every `.squircle.rounded-full`
 * element in the DOM and *directly* set the squircle attributes (inline styles).
 *
 * It:
 * - applies `border-radius: 90px !important` and `corner-shape: superellipse(1.2)` to matches
 * - watches the document for added/removed elements and class changes, updating accordingly
 * - restores previous inline values on unmount / when an element no longer matches
 */

type OrigStyles = {
  borderRadius?: string;
  cornerShape?: string;
};

const PRIORITY = "important";

export const ApplySquircleToDom: React.FC = () => {
  useEffect(() => {
    const store = new WeakMap<HTMLElement, OrigStyles>();

    const selector = ".squircle.rounded-full";

    const apply = (el: HTMLElement) => {
      if (!store.has(el)) {
        // Save previous inline values so we can restore later
        const prev: OrigStyles = {
          borderRadius: el.style.getPropertyValue("border-radius") || undefined,
          cornerShape: el.style.getPropertyValue("corner-shape") || undefined,
        };
        store.set(el, prev);
      }
      // Directly set inline properties (with !important for border-radius)
      el.style.setProperty("border-radius", "90px", PRIORITY);
      el.style.setProperty("corner-shape", "superellipse(1.2)");
    };

    const restore = (el: HTMLElement) => {
      const prev = store.get(el);
      if (!prev) {
        // If we never stored a value, just remove our properties
        el.style.removeProperty("border-radius");
        el.style.removeProperty("corner-shape");
        return;
      }
      if (
        typeof prev.borderRadius === "undefined" ||
        prev.borderRadius === ""
      ) {
        el.style.removeProperty("border-radius");
      } else {
        el.style.setProperty("border-radius", prev.borderRadius, ""); // restore without priority
      }
      if (typeof prev.cornerShape === "undefined" || prev.cornerShape === "") {
        el.style.removeProperty("corner-shape");
      } else {
        el.style.setProperty("corner-shape", prev.cornerShape);
      }
      store.delete(el);
    };

    const scanAndApply = () => {
      // Apply to all current matches
      const list = Array.from(document.querySelectorAll<HTMLElement>(selector));
      list.forEach((el) => apply(el));

      // Also find elements we previously modified that no longer match and restore them.
      // WeakMap doesn't allow iteration, so instead query all elements that have inline border-radius=90px + corner-shape
      // and that no longer match selector, then restore.
      const potential = Array.from(
        document.querySelectorAll<HTMLElement>(
          "[style*='corner-shape'],[style*='border-radius']"
        )
      );
      potential.forEach((el) => {
        if (!el.matches(selector) && store.has(el)) restore(el);
      });
    };

    // Initial pass
    scanAndApply();

    // Observe DOM for additions/removals and class changes
    const mo = new MutationObserver((mutations) => {
      let needsRescan = false;
      for (const m of mutations) {
        // If nodes added/removed - rescan for new/removed matches
        if (
          m.type === "childList" &&
          (m.addedNodes.length || m.removedNodes.length)
        ) {
          needsRescan = true;
          break;
        }
        // If class attribute changed, handle target element directly
        if (
          m.type === "attributes" &&
          m.attributeName === "class" &&
          m.target instanceof HTMLElement
        ) {
          const target = m.target as HTMLElement;
          if (target.matches(selector)) {
            apply(target);
          } else if (store.has(target)) {
            restore(target);
          }
        }
      }
      if (needsRescan) scanAndApply();
    });

    mo.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    // If CSSOM or other scripts change classes via non-standard ways, also periodically rescan as a fallback.
    const interval = window.setInterval(scanAndApply, 1500);

    return () => {
      mo.disconnect();
      clearInterval(interval);
      // restore all elements we touched
      // We cannot iterate WeakMap; instead rescan document for any elements that match our applied style and restore them.
      const touched = Array.from(
        document.querySelectorAll<HTMLElement>(
          "[style*='corner-shape'],[style*='border-radius']"
        )
      );
      touched.forEach((el) => {
        if (store.has(el)) restore(el);
        else {
          // if we didn't store original but it's our applied style (best-effort restore)
          // remove only if values match what we set
          const br = el.style.getPropertyValue("border-radius");
          const cs = el.style.getPropertyValue("corner-shape");
          if (br === "90px" || cs === "superellipse(1.2)") {
            el.style.removeProperty("border-radius");
            el.style.removeProperty("corner-shape");
          }
        }
      });
    };
  }, []);

  return null;
};

export default ApplySquircleToDom;
