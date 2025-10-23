export const formatNumber = (
  value: number | string,
  toFixed: number | string = 1
): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  const fix = typeof toFixed === "string" ? parseFloat(toFixed) : toFixed;

  if (isNaN(num)) return value.toString();

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(fix).replace(/\.0+$/, "")}M`;
  }

  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(fix).replace(/\.0+$/, "")}K`;
  }

  return num.toFixed(fix);
};
