import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Pluralizes a word, with optional support for irregular plural forms.
 * @param count - The number to check.
 * @param singular - The singular word.
 * @param plural - The plural word (defaults to singular + "s").
 * @returns The formatted pluralized string.
 */
export const addS = (
  count: number,
  singular: string,
  plural: string = `${singular}s`,
): string => {
  return `${count} ${count === 1 ? singular : plural}`;
};
