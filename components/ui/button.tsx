/* eslint-disable @typescript-eslint/no-explicit-any */
// import * as React from "react";
// import Link from "next/link";
// import { Slot } from "@radix-ui/react-slot";
// import { cva, type VariantProps } from "class-variance-authority";

// import { cn } from "@/lib/utils";

// const buttonVariants = cva(
//   "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer data-[state=open]:bg-accent data-[state=open]:text-accent-foreground dark:ring-offset-zinc-950 dark:focus-visible:ring-ring-dark dark:data-[state=open]:bg-accent dark:data-[state=open]:text-accent-foreground transition-colors duration-300 active:translate-y-[1px] overflow-hidden",
//   {
//     variants: {
//       variant: {
//         default:
//           "bg-primary text-primary-foreground hover:bg-primary/90 border",
//         destructive:
//           "bg-destructive text-white hover:bg-destructive-hover focus-visible:ring-destructive/20",
//         outline:
//           "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
//         secondary:
//           "bg-secondary text-secondary-foreground hover:bg-secondary/80",
//         ghost: "hover:bg-accent hover:text-accent-foreground",
//         link: "text-primary underline-animate ",
//       },
//       size: {
//         default: "h-10 px-4 py-2",
//         sm: "h-9 rounded-md px-3",
//         lg: "h-11 rounded-md px-8",
//         icon: "h-10 w-10",
//       },
//     },
//     defaultVariants: {
//       variant: "default",
//       size: "default",
//     },
//   }
// );

// // Base button props
// interface BaseButtonProps extends VariantProps<typeof buttonVariants> {
//   asChild?: boolean;
//   className?: string;
// }

// // Button props (when no href)
// interface ButtonAsButton
//   extends BaseButtonProps,
//     React.ButtonHTMLAttributes<HTMLButtonElement> {
//   href?: never;
// }

// // Anchor props (when href is provided)
// interface ButtonAsLink
//   extends BaseButtonProps,
//     React.AnchorHTMLAttributes<HTMLAnchorElement> {
//   href: string;
// }

// // Union type
// export type ButtonProps = ButtonAsButton | ButtonAsLink;

// // Helper to check if URL is external
// const isExternalUrl = (href: string): boolean => {
//   return (
//     href.startsWith("http://") ||
//     href.startsWith("https://") ||
//     href.startsWith("//")
//   );
// };

// const Button = React.forwardRef<
//   HTMLButtonElement | HTMLAnchorElement,
//   ButtonProps
// >(({ className, variant, size, asChild = false, ...props }, ref) => {
//   const buttonClasses = cn(buttonVariants({ variant, size, className }));

//   // If href is provided, render as link
//   if ("href" in props && props.href) {
//     const { href, ...anchorProps } = props;

//     // Use asChild if specified
//     if (asChild) {
//       return (
//         <Slot
//           className={buttonClasses}
//           ref={ref as React.Ref<HTMLAnchorElement>}
//           {...(anchorProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
//         />
//       );
//     }

//     // External URL - use regular anchor
//     if (isExternalUrl(href)) {
//       return (
//         <a
//           href={href}
//           className={buttonClasses}
//           ref={ref as React.Ref<HTMLAnchorElement>}
//           {...(anchorProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
//         />
//       );
//     }

//     // Internal URL - use Next.js Link
//     return (
//       <Link
//         href={href}
//         className={buttonClasses}
//         ref={ref as React.Ref<HTMLAnchorElement>}
//         {...(anchorProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
//       />
//     );
//   }

//   // Otherwise, render as button
//   const Comp = asChild ? Slot : "button";
//   return (
//     <Comp
//       className={buttonClasses}
//       ref={ref as React.Ref<HTMLButtonElement>}
//       {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
//     />
//   );
// });
// Button.displayName = "Button";

// export { Button, buttonVariants };

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
          "bg-destructive text-white hover:bg-destructive-hover focus-visible:ring-destructive/20",
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
// NOTE: added `disabled?: boolean` to allow anchors to accept a "disabled" prop
// (anchors don't support native disabled, we handle it manually).
interface ButtonAsLink
  extends BaseButtonProps,
    React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  disabled?: boolean;
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
    // `anchorProps` may include `disabled?: boolean` now
    const { href, disabled, onClick, ...anchorProps } = props as ButtonAsLink;

    const isDisabled = !!disabled;

    // Prevent navigation for disabled anchors (accessibility + programmatic safety).
    const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
      if (isDisabled) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      onClick?.(e as any);
    };

    // Use asChild if specified (Slot will forward props to child).
    if (asChild) {
      // when using asChild, pass disabled through so the child component can handle it too
      return (
        <Slot
          className={buttonClasses}
          ref={ref as React.Ref<HTMLAnchorElement>}
          role={isDisabled ? "link" : undefined}
          aria-disabled={isDisabled ? true : undefined}
          onClick={handleClick}
          {...(anchorProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        />
      );
    }

    // External URL - use regular anchor (native anchor supports ref)
    if (isExternalUrl(href)) {
      return (
        <a
          // remove href when disabled to avoid navigation on middle-click / cmd-click
          href={isDisabled ? undefined : href}
          className={buttonClasses}
          ref={ref as React.Ref<HTMLAnchorElement>}
          onClick={handleClick}
          aria-disabled={isDisabled ? true : undefined}
          // visually indicate disabled state if provided (caller can override)
          data-disabled={isDisabled ? "true" : undefined}
          {...(anchorProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        />
      );
    }

    // Internal URL - use Next.js Link
    // Note: Next.js Link forwards props to the underlying <a>, but forwarding `ref` directly to `Link`
    // can be problematic depending on Next version — avoid passing `ref` to Link here.
    // We still apply className, onClick and aria-disabled to Link (they'll be forwarded to <a>).
    return (
      <Link
        href={isDisabled ? "#" : href} // use "#" if disabled to keep element focusable without navigating
        className={buttonClasses}
        onClick={(e: any) => {
          // Link's onClick will receive a MouseEvent — prevent when disabled
          if (isDisabled) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          // If consumer provided onClick via props, call it
          (onClick as any)?.(e);
        }}
        aria-disabled={isDisabled ? true : undefined}
        {...(anchorProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      />
    );
  }

  // Otherwise, render as button (native button supports `disabled`)
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={buttonClasses}
      ref={ref as React.Ref<HTMLButtonElement>}
      // props typed as ButtonHTMLAttributes will include native `disabled?: boolean`
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };

/*
CHANGES & COMMENTS:
1. Added `disabled?: boolean` to the `ButtonAsLink` interface so anchor-variants can accept `disabled`.
2. When rendering anchors or Next `Link`, we detect `isDisabled` and:
   - prevent navigation via onClick (stop propagation + preventDefault),
   - set `aria-disabled` for accessibility,
   - remove or neutralize `href` (external anchors remove href, internal Links use "#" when disabled).
   This provides an accessible, consistent "disabled" behavior for link variants (anchors don't natively support `disabled`).
3. For `asChild` usage we forward `aria-disabled`, `role`, and the click handler so the wrapped child can reflect disabled state.
4. Avoid passing `ref` directly to Next `Link` because different Next versions handle refs differently — we pass `ref` to real anchor elements only (external anchor or Slot).
*/
