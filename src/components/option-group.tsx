"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Option<T extends string> = {
  value: T;
  label: string;
  helper?: string;
};

type OptionGroupProps<T extends string> = {
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  columns?: "one" | "two";
};

export function OptionGroup<T extends string>({ options, value, onChange, columns = "two" }: OptionGroupProps<T>) {
  return (
    <div className={cn("grid gap-2", columns === "two" ? "grid-cols-2" : "grid-cols-1")}>
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            aria-pressed={active}
            className={cn(
              "min-h-[62px] rounded-lg border px-3 py-3 text-left transition duration-200",
              active
                ? "border-[hsl(var(--app-primary))] bg-[hsl(var(--app-soft))] text-[hsl(var(--app-primary))]"
                : "border-[hsl(var(--app-border))] bg-[hsl(var(--app-card))] text-[hsl(var(--app-ink))] hover:border-[hsl(var(--app-primary)/0.55)] hover:bg-[hsl(var(--app-soft)/0.58)]"
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold leading-5">{option.label}</span>
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border transition",
                  active
                    ? "border-[hsl(var(--app-primary))] bg-[hsl(var(--app-primary))] text-[hsl(var(--app-primary-ink))]"
                    : "border-[hsl(var(--app-border))] text-transparent"
                )}
              >
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>
            </span>
            {option.helper ? (
              <span className="mt-1 block text-xs leading-5 text-[hsl(var(--app-muted))]">{option.helper}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
