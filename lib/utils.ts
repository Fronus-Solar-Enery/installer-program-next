import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MotionCard = motion(Card);
