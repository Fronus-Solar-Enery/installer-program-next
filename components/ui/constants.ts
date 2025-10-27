import { cva } from "class-variance-authority";

export const variants = {
  default: [
    "bg-zinc-300/70 text-zinc-900",
    "dark:bg-zinc-800 dark:text-zinc-300",
    "focus-visible:outline-zinc-600/90 focus-visible:dark:outline-zinc-700",
  ].join(" "),

  outline: [
    "border-zinc-200 bg-transparent text-zinc-950 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/50",
  ].join(" "),

  primary: [
    "bg-blue-900 text-white",
    "dark:bg-blue-700 dark:text-white",
    "focus-visible:outline-blue-1000 focus-visible:dark:outline-blue-700",
  ].join(" "),

  secondary: [
    "bg-zinc-800 text-zinc-100",
    "dark:bg-zinc-900 dark:text-zinc-300",
    "focus-visible:outline-primary-800 focus-visible:dark:outline-primary-800",
  ].join(" "),

  neutral: [
    "text-zinc-800 bg-zinc-300/50",
    "dark:text-zinc-500 dark:bg-transparent",
    "focus-visible:outline-zinc-500 focus-visible:dark:outline-zinc-800",
  ].join(" "),

  destructive: [
    "bg-rose-200 text-rose-400",
    "dark:bg-rose-800 dark:text-white",
    "focus-visible:outline-rose-500 focus-visible:dark:outline-rose-400",
  ].join(" "),

  link: [
    "bg-transparent text-secondary",
    "dark:bg-transparent dark:text-zinc-400",
    "focus-visible:outline-zinc-500 focus-visible:dark:outline-zinc-600",
  ].join(" "),

  info: [
    "bg-cyan-500 text-white",
    "dark:bg-cyan-950/50 dark:text-cyan-400",
    "focus-visible:outline-cyan-700 focus-visible:dark:outline-cyan-300",
  ].join(" "),

  success: [
    "bg-emerald-500 text-white",
    "dark:bg-emerald-950/50 dark:text-emerald-400",
    "focus-visible:outline-emerald-700 focus-visible:dark:outline-emerald-200",
  ].join(" "),

  warning: [
    "bg-yellow-500 text-white",
    "dark:bg-yellow-500 dark:text-white",
    "focus-visible:outline-yellow-700 focus-visible:dark:outline-yellow-300",
  ].join(" "),

  "warning-soft": [
    "bg-yellow-500 text-white",
    "dark:bg-yellow-950/40 dark:text-yellow-400",
    "focus-visible:outline-yellow-700 focus-visible:dark:outline-yellow-300",
  ].join(" "),

  dark: [
    "bg-zinc-950/90 text-white",
    "dark:bg-zinc-950 dark:text-white",
    "focus-visible:outline-zinc-500 focus-visible:dark:outline-zinc-300",
  ].join(" "),

  "outline-primary": [
    "border border-primary-900 text-primary-900 bg-transparent",
    "dark:border-primary-800 dark:text-primary-700",
    "focus-visible:outline-primary-900 focus-visible:dark:outline-primary-700",
  ].join(" "),

  "outline-info": [
    "border border-cyan-500 text-cyan-500 bg-transparent",
    "dark:border-cyan-600 dark:text-cyan-400",
    "focus-visible:outline-cyan-900 focus-visible:dark:outline-cyan-300",
  ].join(" "),

  "outline-success": [
    "border border-emerald-500 text-emerald-500 bg-transparent",
    "dark:border-emerald-600 dark:text-emerald-400",
    "focus-visible:outline-emerald-600 focus-visible:dark:outline-emerald-300",
  ].join(" "),

  "outline-warning": [
    "border border-yellow-500 text-yellow-500 bg-transparent",
    "dark:border-yellow-500 dark:text-yellow-400",
    "focus-visible:outline-yellow-600 focus-visible:dark:outline-yellow-300",
  ].join(" "),

  "outline-destructive": [
    "border border-red-500 text-red-500 bg-transparent",
    "dark:border-red-400 dark:text-red-400",
    "focus-visible:outline-red-500 focus-visible:dark:outline-red-500",
  ].join(" "),

  "outline-dark": [
    "border border-zinc-800 text-zinc-800 bg-transparent",
    "dark:border-zinc-400 dark:text-zinc-400",
    "focus-visible:outline-zinc-800 focus-visible:dark:outline-zinc-500",
  ].join(" "),
} as const;

export const sizes = {
  xs: "px-2 py-1 text-xs",
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  default: "px-6 py-3 text-sm",
  lg: "px-10 py-5 text-base",
  xl: "px-14 py-6 text-lg",
  icon: "p-3 !aspect-square",
} as const;

export const rounded = {
  none: "",
  xs: "rounded-md",
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  full: "rounded-full",
} as const;

export const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
