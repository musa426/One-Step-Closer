"use client";

import { Sparkles } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { useAppData } from "@/components/app-provider";
import { focusLabels } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { settings, storageReady, storageReadError, storageWriteError } = useAppData();

  return (
    <div className={cn("app-background min-h-screen text-[hsl(var(--app-ink))]", `theme-${settings.theme}`)}>
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl gap-5 px-4 pb-24 pt-4 sm:px-6 md:px-5 md:py-5">
        <Navigation />
        <div className="min-w-0 flex-1">
          <header className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-[hsl(var(--app-border))] bg-[hsl(var(--app-card)/0.78)] px-4 py-4 shadow-soft backdrop-blur-sm sm:px-5">
            <div className="min-w-0">
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--app-muted))]">
                一步靠近
              </p>
              <h1 className="truncate text-2xl font-semibold leading-tight text-[hsl(var(--app-ink))] sm:text-3xl/9">
                {settings.appName || "One Step Closer"}
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-lg bg-[hsl(var(--app-soft))] px-3 py-2 text-xs font-medium text-[hsl(var(--app-primary))]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>{focusLabels[settings.mainFocus]}</span>
            </div>
          </header>
          {storageReadError ? (
            <p role="alert" className="mb-4 rounded-lg border border-[hsl(var(--app-border))] bg-[hsl(var(--app-card))] p-4 text-sm">
              无法读取本机保存的部分数据。原始内容已保留；为避免覆盖，暂时停止编辑。请刷新后重试，问题仍在时联系维护者。
            </p>
          ) : storageWriteError ? (
            <p role="alert" className="mb-4 rounded-lg border border-[hsl(var(--app-border))] bg-[hsl(var(--app-card))] p-4 text-sm">
              保存失败，刚才的更改没有保留。请检查浏览器存储空间或权限后重试。
            </p>
          ) : null}
          <main className="page-enter">
            {storageReady ? (
              <fieldset disabled={storageReadError} className="min-w-0">
                {children}
              </fieldset>
            ) : (
              <p role="status" className="p-4 text-sm">正在读取这台设备上的记录…</p>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
