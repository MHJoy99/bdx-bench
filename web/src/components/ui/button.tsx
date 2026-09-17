import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] border text-[13px] font-medium select-none transition-[background-color,border-color,color,filter,transform] duration-150 active:scale-[0.98] motion-reduce:transform-none disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] touch-manipulation [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Electric lime fill — primary action only. */
        default:
          "border-transparent bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.25)] hover:brightness-105 active:brightness-95",
        secondary:
          "border-[var(--border)] bg-[var(--elevated)] text-[var(--text)] hover:border-[var(--border-strong)] hover:bg-[var(--elevated)]/90 active:bg-[var(--surface)]",
        outline:
          "border-[var(--border-strong)] bg-[var(--surface)]/50 text-[var(--text)] hover:bg-[var(--elevated)] hover:text-[var(--text)] active:bg-[var(--surface)]",
        ghost:
          "border-transparent bg-transparent text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--elevated)] active:bg-[var(--surface)]",
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
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, children, disabled, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {isLoading ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
