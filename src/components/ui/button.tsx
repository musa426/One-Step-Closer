import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "quiet";
  size?: "sm" | "md" | "icon";
};

const variants = {
  primary:
    "bg-[hsl(var(--app-primary))] text-[hsl(var(--app-primary-ink))] shadow-soft hover:translate-y-[-1px] hover:bg-[hsl(var(--app-primary)/0.94)]",
  secondary:
    "border border-[hsl(var(--app-border))] bg-[hsl(var(--app-card))] text-[hsl(var(--app-ink))] hover:bg-[hsl(var(--app-soft))]",
  ghost:
    "text-[hsl(var(--app-muted))] hover:bg-[hsl(var(--app-soft))] hover:text-[hsl(var(--app-ink))]",
  quiet:
    "bg-[hsl(var(--app-soft))] text-[hsl(var(--app-primary))] hover:bg-[hsl(var(--app-soft)/0.8)]"
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  icon: "h-10 w-10 p-0"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition duration-200 ease-out focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[hsl(var(--app-accent))] disabled:pointer-events-none disabled:opacity-60",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
