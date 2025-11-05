import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Lazy load modals with loading fallback
export const LazyInstallerEditModal = dynamic(
  () => import("@/components/InstallerEditModal"),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
    ssr: false,
  }
);
