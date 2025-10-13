import * as React from "react";
import Link from "next/link";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer data-[state=open]:bg-accent data-[state=open]:text-accent-foreground dark:ring-offset-zinc-950 dark:focus-visible:ring-ring-dark dark:data-[state=open]:bg-accent dark:data-[state=open]:text-accent-foreground transition-colors duration-300 active:translate-y-[1px] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 border",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:bg-rose-800 dark:hover:bg-rose-700",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-animate ",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Base button props
interface BaseButtonProps extends VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  className?: string;
}

// Button props (when no href)
interface ButtonAsButton
  extends BaseButtonProps,
    React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: never;
}

// Anchor props (when href is provided)
interface ButtonAsLink
  extends BaseButtonProps,
    React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

// Union type
export type ButtonProps = ButtonAsButton | ButtonAsLink;

// Helper to check if URL is external
const isExternalUrl = (href: string): boolean => {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("//")
  );
};

const Button = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const buttonClasses = cn(buttonVariants({ variant, size, className }));

  // If href is provided, render as link
  if ("href" in props && props.href) {
    const { href, ...anchorProps } = props;

    // Use asChild if specified
    if (asChild) {
      return (
        <Slot
          className={buttonClasses}
          ref={ref as React.Ref<HTMLAnchorElement>}
          {...(anchorProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        />
      );
    }

    // External URL - use regular anchor
    if (isExternalUrl(href)) {
      return (
        <a
          href={href}
          className={buttonClasses}
          ref={ref as React.Ref<HTMLAnchorElement>}
          {...(anchorProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        />
      );
    }

    // Internal URL - use Next.js Link
    return (
      <Link
        href={href}
        className={buttonClasses}
        ref={ref as React.Ref<HTMLAnchorElement>}
        {...(anchorProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      />
    );
  }

  // Otherwise, render as button
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={buttonClasses}
      ref={ref as React.Ref<HTMLButtonElement>}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
