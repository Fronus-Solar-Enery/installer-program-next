import ProgramLogo from "@/components/ProgramLogo";

/** Shared inner visual for LandingPreloader (loading.tsx) and BootSplash. */
export default function PreloaderContent() {
  return (
    <>
      <div className="lp-breathe">
        <ProgramLogo className="h-16 sm:h-20" />
      </div>

      {/* Indeterminate brand track */}
      <div className="relative h-1 w-40 overflow-hidden rounded-full bg-foreground/10">
        <span className="lp-indeterminate absolute inset-y-0 w-1/3 rounded-full bg-brand-900 dark:bg-brand-800" />
      </div>

      <span className="sr-only">Loading Fronus Installer Program…</span>
    </>
  );
}
