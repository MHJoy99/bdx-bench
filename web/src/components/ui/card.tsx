import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Enables subtle hover elevation and border transition */
  interactive?: boolean;
  /** Enables top border accent highlight */
  highlight?: boolean;
}

/** Flat surface card with subtle inner highlight. Max radius 10px, 1px border. */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, highlight = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),var(--shadow-card)]",
        interactive &&
          "transition-[border-color,box-shadow,transform] duration-200 ease-out hover:border-[var(--border-strong)] hover:shadow-md hover:-translate-y-0.5 motion-reduce:transform-none",
        highlight &&
          "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[var(--accent)] before:to-transparent",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1 p-4 pb-2", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    // eslint-disable-next-line jsx-a11y/heading-has-content
    <h3
      ref={ref}
      className={cn("text-sm font-semibold leading-5 tracking-tight", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-[13px] leading-5 text-[var(--text-secondary)]", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4 pt-2 text-[13px] leading-5", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-2 border-t border-[var(--border)] p-4 pt-3",
        className,
      )}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
