export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000; // seconds

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [unit, secondsInUnit] of units) {
    const value = Math.floor(diff / secondsInUnit);
    if (Math.abs(value) >= 1) {
      return rtf.format(-value, unit);
    }
  }

  return "just now";
}
