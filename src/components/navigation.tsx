"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck2, HandHeart, HeartHandshake, MapPinned, Settings, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "今日", icon: CalendarCheck2 },
  { href: "/weekly", label: "本周", icon: Sprout },
  { href: "/places", label: "地点", icon: MapPinned },
  { href: "/partner", label: "同行", icon: HeartHandshake },
  { href: "/settings", label: "设置", icon: Settings }
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <>
      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-lg border border-[hsl(var(--app-border))] bg-[hsl(var(--app-nav)/0.92)] p-1 shadow-soft backdrop-blur-sm md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium text-[hsl(var(--app-muted))] transition",
                  active && "bg-[hsl(var(--app-primary))] text-[hsl(var(--app-primary-ink))]"
                )}
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <aside className="sticky top-5 hidden h-[calc(100vh-40px)] w-60 shrink-0 rounded-lg border border-[hsl(var(--app-border))] bg-[hsl(var(--app-nav)/0.82)] p-3 shadow-soft backdrop-blur-sm md:block">
        <div className="mb-5 flex items-center gap-3 rounded-lg bg-[hsl(var(--app-soft))] px-3 py-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[hsl(var(--app-card))] text-[hsl(var(--app-primary))]">
            <HandHeart className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[hsl(var(--app-ink))]">温柔追踪</p>
            <p className="text-xs text-[hsl(var(--app-muted))]">一步一步靠近</p>
          </div>
        </div>
        <div className="space-y-1">
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-[hsl(var(--app-muted))] transition hover:bg-[hsl(var(--app-soft))] hover:text-[hsl(var(--app-ink))]",
                  active && "bg-[hsl(var(--app-primary))] text-[hsl(var(--app-primary-ink))] hover:bg-[hsl(var(--app-primary))] hover:text-[hsl(var(--app-primary-ink))]"
                )}
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
