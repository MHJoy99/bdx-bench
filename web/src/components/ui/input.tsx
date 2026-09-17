import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/** Dense 32px input matching dashboard density. */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-8 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[13px] text-[var(--text)]",
        "placeholder:text-[var(--text-tertiary)]",
        "hover:border-[var(--border-strong)] focus:border-[var(--accent-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-soft)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-[var(--danger)]",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
