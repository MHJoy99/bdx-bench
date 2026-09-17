import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md border text-[13px] font-medium transition-colors select-none disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Electric lime fill — primary action only. */
        default:
          "border-transparent bg-[var(--accent)] text-[var(--accent-foreground)] hover:brightness-95 active:brightness-90",
        secondary:
          "border-[var(--border)] bg-[var(--elevated)] text-[var(--text)] hover:border-[var(--border-strong)] active:bg-[var(--surface)]",
        outline:
          "border-[var(--border-strong)] bg-transparent text-[var(--text)] hover:bg-[var(--accent-muted)] hover:border-[var(--accent-border)]",
        ghost:
          "border-transparent bg-transparent text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--elevated)]",
        destructive:
          "border-transparent bg-[var(--danger)] text-[#0b0e12] hover:brightness-95",
        link: "border-transparent bg-transparent text-[var(--accent-ink)] underline-offset-4 hover:underline px-0",
      },
      size: {
        sm: "h-7 px-2.5 text-xs",
        default: "h-8 px-3.5",
        lg: "h-10 px-5 text-sm",
        icon: "h-8 w-8 p-0",
        "icon-sm": "h-7 w-7 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
