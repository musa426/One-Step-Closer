import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[96px] w-full resize-none rounded-lg border border-[hsl(var(--app-border))] bg-[hsl(var(--app-card))] px-3 py-3 text-sm leading-6 text-[hsl(var(--app-ink))] outline-hidden transition placeholder:text-[hsl(var(--app-muted)/0.72)] focus:border-[hsl(var(--app-primary))] focus:ring-2 focus:ring-[hsl(var(--app-primary)/0.12)]",
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";
