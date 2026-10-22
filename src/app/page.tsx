"use client";

import { BookOpenText, CalendarHeart, CheckCircle2, Leaf, MessageCircleHeart, MoonStar } from "lucide-react";
import { OptionGroup } from "@/components/option-group";
import { SectionCard } from "@/components/section-card";
import { useAppData } from "@/components/app-provider";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatChineseDate, getTodayKey } from "@/lib/dates";
import { useTodayKey } from "@/lib/use-today";
import {
  createBlankEntry,
  foodLabels,
  quranLabels,
  salahLabels,
  type FoodStatus,
  type QuranStatus,
  type SalahKey
} from "@/lib/types";
import { cn } from "@/lib/utils";

const foodOptions = [
  { value: "halal", label: foodLabels.halal, helper: "今天的选择很清楚" },
  { value: "vegetarian_seafood", label: foodLabels.vegetarian_seafood, helper: "也是温和的靠近" },
  { value: "unsure", label: foodLabels.unsure, helper: "可以先记录，不急着评判" },
  { value: "not_halal", label: foodLabels.not_halal, helper: "记录事实就足够了" }
] satisfies { value: NonNullable<FoodStatus>; label: string; helper: string }[];

const quranOptions = [
  { value: "none", label: quranLabels.none, helper: "休息也可以被温柔看见" },
  { value: "translation", label: quranLabels.translation, helper: "理解一句也算靠近" },
  { value: "tafsir", label: quranLabels.tafsir, helper: "给意义多一点空间" },
  { value: "listened", label: quranLabels.listened, helper: "让声音陪你一会儿" },
  { value: "five_minutes", label: quranLabels.five_minutes, helper: "短短几分钟也很好" }
] satisfies { value: NonNullable<QuranStatus>; label: string; helper: string }[];

const salahOrder: SalahKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export default function DailyCheckInPage() {
  const todayKey = useTodayKey();
  const { entries, upsertEntry, settings } = useAppData();
  if (!todayKey) return null;
  const entry = entries[todayKey] ?? createBlankEntry(todayKey);
  const salahCount = Object.values(entry.salah).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--app-soft))] px-3 py-2 text-xs font-medium text-[hsl(var(--app-primary))]">
              <CalendarHeart className="h-4 w-4" aria-hidden="true" />
              {formatChineseDate(todayKey)}
            </div>
            <h2 className="text-2xl font-semibold leading-tight text-[hsl(var(--app-ink))] sm:text-3xl/9">
              今天只需要一步
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[hsl(var(--app-muted))]">
              {settings.reminderText || "小小的靠近，也值得被记录。"}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-72">
            <MiniMetric label="饮食" value={entry.foodStatus ? "已记" : "待记"} />
            <MiniMetric label="礼拜" value={`${salahCount}/5`} />
            <MiniMetric label="Qur'an" value={entry.quran && entry.quran !== "none" ? "有接触" : "安静"} />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <SectionCard icon={Leaf} title="饮食" description="只记录今天，不评价昨天。">
            <OptionGroup
              options={foodOptions}
              value={entry.foodStatus}
              onChange={(foodStatus) =>
                upsertEntry(getTodayKey(), (current) => ({
                  ...current,
                  foodStatus
                }))
              }
            />
          </SectionCard>

          <SectionCard icon={MoonStar} title="Salah" description="勾选你今天已经完成的礼拜。">
            <div className="grid gap-2">
              {salahOrder.map((key) => {
                const checked = entry.salah[key];
                return (
                  <button
                    aria-pressed={checked}
                    className={cn(
                      "flex h-14 items-center justify-between rounded-lg border px-3 text-left transition",
                      checked
                        ? "border-[hsl(var(--app-primary))] bg-[hsl(var(--app-soft))] text-[hsl(var(--app-primary))]"
                        : "border-[hsl(var(--app-border))] bg-[hsl(var(--app-card))] text-[hsl(var(--app-ink))] hover:bg-[hsl(var(--app-soft)/0.58)]"
                    )}
                    key={key}
                    onClick={() =>
                      upsertEntry(getTodayKey(), (current) => ({
                        ...current,
                        salah: {
                          ...current.salah,
                          [key]: !current.salah[key]
                        }
                      }))
                    }
                    type="button"
                  >
                    <span className="font-medium">{salahLabels[key]}</span>
                    <CheckCircle2
                      className={cn("h-5 w-5 transition", checked ? "opacity-100" : "text-[hsl(var(--app-border))]")}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard icon={BookOpenText} title="Qur'an" description="选择一种今天和 Qur'an 接触的方式。">
            <OptionGroup
              columns="one"
              options={quranOptions}
              value={entry.quran}
              onChange={(quran) =>
                upsertEntry(getTodayKey(), (current) => ({
                  ...current,
                  quran
                }))
              }
            />
          </SectionCard>

          <SectionCard icon={MessageCircleHeart} title="小小觉察" description="可选。只写你注意到的事情。">
            <Textarea
              value={entry.reflection}
              onChange={(event) =>
                upsertEntry(getTodayKey(), (current) => ({
                  ...current,
                  reflection: event.target.value
                }))
              }
              placeholder="今天有什么让你更靠近、更平静，或只是想记下来的事？"
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[hsl(var(--app-border))] bg-[hsl(var(--app-card))] px-3 py-3">
      <p className="text-xs text-[hsl(var(--app-muted))]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[hsl(var(--app-ink))]">{value}</p>
    </div>
  );
}
