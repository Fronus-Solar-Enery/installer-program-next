import LandingPreloader from "@/components/landing/LandingPreloader";

// Overrides root app/loading.tsx for the landing route only, so the marketing
// page shows its own preloader instead of the dashboard-shaped skeleton.
export default function Loading() {
  return <LandingPreloader />;
}
