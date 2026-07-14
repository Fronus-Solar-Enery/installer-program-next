/**
 * Cross-view refresh bus. The dashboard, installers list/detail, and rewards
 * list all listen for the "app:refresh" window event and refetch their data.
 * Call this after any mutation that changes installer/reward records so those
 * views don't show stale numbers. The manual navbar Refresh button fires the
 * same event.
 */
export const APP_REFRESH_EVENT = "app:refresh";

export function emitAppRefresh(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(APP_REFRESH_EVENT));
  }
}
