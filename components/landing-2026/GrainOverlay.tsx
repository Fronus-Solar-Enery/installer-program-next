/**
 * Full-viewport film-grain texture. Fixed, non-interactive.
 * The opacity/texture is defined in globals.css (.lp-grain) so it stays a
 * pure presentational layer that never intercepts pointer events.
 */
export default function GrainOverlay() {
  return <div aria-hidden className="lp-grain" />;
}
