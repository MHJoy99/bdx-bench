import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

/**
 * Native <select> styled to the system (no Radix dependency).
 * Full keyboard + screen-reader support comes free from the platform.
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <span className={cn("relative inline-flex items-center", className)}>
      <select
        ref={ref}
        className={cn(
          "h-8 appearance-none rounded-md border border-[var(--border)] bg-[var(--surface)] pl-2.5 pr-8 text-[13px] font-medium text-[var(--text)]",
          "hover:border-[var(--border-strong)] focus:border-[var(--accent-border)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-soft)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2 size-4 text-[var(--text-tertiary)]"
      />
    </span>
  ),
);
Select.displayName = "Select";

export { Select };
