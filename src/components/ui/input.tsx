import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-lg border border-[hsl(var(--app-border))] bg-[hsl(var(--app-card))] px-3 text-sm text-[hsl(var(--app-ink))] outline-hidden transition placeholder:text-[hsl(var(--app-muted)/0.72)] focus:border-[hsl(var(--app-primary))] focus:ring-2 focus:ring-[hsl(var(--app-primary)/0.12)]",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
