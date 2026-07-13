import LandingPreloader from "@/components/landing/LandingPreloader";

// Public installer-facing routes share the landing preloader instead of the
// root dashboard skeleton.
export default function Loading() {
  return <LandingPreloader />;
}
