"use client";

import { BookOpenCheck, CalendarDays, Leaf, MoonStar } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { useAppData } from "@/components/app-provider";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatWeekRange, getWeekDateKeys, parseDateKey } from "@/lib/dates";
import { useTodayKey } from "@/lib/use-today";

export default function WeeklyProgressPage() {
  const todayKey = useTodayKey();
  const { entries } = useAppData();
  if (!todayKey) return null;
  const weekKeys = getWeekDateKeys(parseDateKey(todayKey));
  const weekEntries = weekKeys.map((key) => entries[key]).filter(Boolean);

  const halalFriendlyDays = weekEntries.filter(
    (entry) => entry.foodStatus === "halal" || entry.foodStatus === "vegetarian_seafood"
  ).length;
  const salahCompleted = weekEntries.reduce(
    (total, entry) => total + Object.values(entry.salah).filter(Boolean).length,
    0
  );
  const quranDays = weekEntries.filter((entry) => entry.quran && entry.quran !== "none").length;
  const touchedAny = halalFriendlyDays + salahCompleted + quranDays > 0;

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--app-soft))] px-3 py-2 text-xs font-medium text-[hsl(var(--app-primary))]">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {formatWeekRange(weekKeys)}
            </div>
            <CardTitle className="text-2xl sm:text-3xl/9">本周的温柔进度</CardTitle>
            <CardDescription className="mt-2 max-w-2xl">
              这里只看见每一次回来、每一个更好的选择、每一点稳定。
            </CardDescription>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Leaf}
          label="清真友好日"
          value={`${halalFriendlyDays}`}
          note="清真、素食或海鲜都算作靠近。"
        />
        <StatCard icon={MoonStar} label="已完成礼拜" value={`${salahCompleted}`} note="每一拜都被温柔记录。" />
        <StatCard
          icon={BookOpenCheck}
          label="Qur'an 接触日"
          value={`${quranDays}`}
          note="译文、tafsir、聆听或 5 分钟都算。"
        />
      </div>

      <Card className="p-5">
        <p className="text-sm font-medium text-[hsl(var(--app-muted))]">给这一周的一句话</p>
        <p className="mt-3 text-xl font-semibold leading-8 text-[hsl(var(--app-ink))]">{getGentleMessage(halalFriendlyDays, salahCompleted, quranDays)}</p>
        {!touchedAny ? (
          <p className="mt-3 text-sm leading-6 text-[hsl(var(--app-muted))]">
            你可以从今天的一项开始。一个选择、一拜、或一句译文，都足够成为开始。
          </p>
        ) : (
          <p className="mt-3 text-sm leading-6 text-[hsl(var(--app-muted))]">
            进度不需要喧闹。能被你重复想起的事，会慢慢变得更容易。
          </p>
        )}
      </Card>
    </div>
  );
}

function getGentleMessage(halalFriendlyDays: number, salahCompleted: number, quranDays: number) {
  const total = halalFriendlyDays + salahCompleted + quranDays;

  if (total === 0) {
    return "明天仍然敞开。";
  }

  if (halalFriendlyDays >= 4 && salahCompleted >= 15 && quranDays >= 3) {
    return "这一周，你让很多小选择连在了一起。";
  }

  if (quranDays > 0 && salahCompleted > 0 && halalFriendlyDays > 0) {
    return "你在不同地方都往前靠近了一点。";
  }

  if (salahCompleted >= 10) {
    return "你一次次回来了。";
  }

  if (halalFriendlyDays >= 3) {
    return "一个更好的选择，已经很有分量。";
  }

  if (quranDays >= 2) {
    return "理解和聆听，也是在靠近。";
  }

  return "小步也算数。";
}
