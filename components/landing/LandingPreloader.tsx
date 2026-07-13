import PreloaderContent from "./PreloaderContent";

/**
 * Public loading screen (landing + standalone) rendered from loading.tsx.
 * Pure CSS (see PreloaderContent / globals.css) so it animates inside the
 * pre-hydration loading shell Next.js streams during server render. Covers
 * client-side route navigations; BootSplash covers the full first/hard load.
 */
export default function LandingPreloader() {
  return (
    <div
      className="fixed inset-0 z-9999! flex flex-col items-center justify-center gap-8 bg-background"
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <PreloaderContent />
    </div>
  );
}
