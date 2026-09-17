import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
  id: string;
}
const TabsContext = React.createContext<TabsContextValue | null>(null);

/** Radix-free tabs: full keyboard (arrows/Home/End) + aria tab pattern. */
function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue">) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const id = React.useId();
  const controlled = value !== undefined;
  const current = controlled ? value : internal;
  const setValue = (v: string) => {
    if (!controlled) setInternal(v);
    onValueChange?.(v);
  };
  return (
    <TabsContext.Provider value={{ value: current, setValue, id }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(TabsContext);
  const ref = React.useRef<HTMLDivElement>(null);
  const onKeyDown = (e: React.KeyboardEvent) => {
    const el = ref.current;
    if (!el || !ctx) return;
    const triggers = Array.from(
      el.querySelectorAll<HTMLElement>('[role="tab"]:not([aria-disabled="true"])'),
    );
    const i = triggers.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % triggers.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      next = (i - 1 + triggers.length) % triggers.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = triggers.length - 1;
    if (next >= 0) {
      e.preventDefault();
      const target = triggers[next];
      target?.focus();
      target?.click();
    }
  };
  return (
    <div
      ref={ref}
      role="tablist"
      aria-label="Sections"
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex h-8 items-center gap-0.5 rounded-md border border-[var(--border)] bg-[var(--surface)] p-0.5",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  value,
  className,
  children,
  disabled,
  ...props
}: {
  value: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be used inside <Tabs>");
  const selected = ctx.value === value;
  return (
    <button
      role="tab"
      type="button"
      aria-selected={selected}
      aria-controls={`${ctx.id}-${value}-panel`}
      id={`${ctx.id}-${value}-tab`}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      onClick={() => ctx.setValue(value)}
      className={cn(
        "inline-flex h-7 items-center rounded-[6px] px-2.5 text-[13px] font-medium transition-colors",
        "text-[var(--text-secondary)] hover:text-[var(--text)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        "disabled:pointer-events-none disabled:opacity-45",
        selected && "bg-[var(--elevated)] text-[var(--text)] shadow-none ring-1 ring-[var(--border-strong)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function TabsContent({
  value,
  className,
  children,
  ...props
}: {
  value: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used inside <Tabs>");
  if (ctx.value !== value) return null;
  return (
    <div
      role="tabpanel"
      id={`${ctx.id}-${value}-panel`}
      aria-labelledby={`${ctx.id}-${value}-tab`}
      tabIndex={0}
      className={cn("pt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-md", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
