"use client";

import { CheckCircle2, HeartHandshake, MessageSquareHeart, UsersRound } from "lucide-react";
import { OptionGroup } from "@/components/option-group";
import { SectionCard } from "@/components/section-card";
import { useAppData } from "@/components/app-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { partnerGoalLabels, type PartnerGoal } from "@/lib/types";
import { isSameWeek, parseDateKey } from "@/lib/dates";
import { useTodayKey } from "@/lib/use-today";
import { cn } from "@/lib/utils";

const goalOptions = [
  { value: "eat_halal_together", label: partnerGoalLabels.eat_halal_together, helper: "把一顿饭变成共同的小步" },
  { value: "try_new_halal_place", label: partnerGoalLabels.try_new_halal_place, helper: "一起发现一个可靠选择" },
  { value: "cook_halal_meal", label: partnerGoalLabels.cook_halal_meal, helper: "在家慢慢练习" },
  { value: "avoid_active_non_halal", label: partnerGoalLabels.avoid_active_non_halal, helper: "少一次主动选择就很好" }
] satisfies { value: PartnerGoal; label: string; helper: string }[];

export default function PartnerModePage() {
  const todayKey = useTodayKey();
  const { partner, setPartner } = useAppData();
  const completedThisWeek = Boolean(
    todayKey && partner.completedThisWeek && isSameWeek(partner.updatedAt, parseDateKey(todayKey))
  );

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[hsl(var(--app-soft))] text-[hsl(var(--app-primary))]">
            <HeartHandshake className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-[hsl(var(--app-ink))]">Partner Mode</h2>
            <p className="mt-2 text-sm leading-6 text-[hsl(var(--app-muted))]">
              两个人一起靠近时，目标要小、清楚、没有压力。
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <SectionCard icon={UsersRound} title="同行的人" description="名字只保存在这台设备上。">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={partner.personOne}
                onChange={(event) =>
                  setPartner((current) => ({
                    ...current,
                    personOne: event.target.value
                  }))
                }
                placeholder="我"
              />
              <Input
                value={partner.personTwo}
                onChange={(event) =>
                  setPartner((current) => ({
                    ...current,
                    personTwo: event.target.value
                  }))
                }
                placeholder="同行的人"
              />
            </div>
          </SectionCard>

          <SectionCard icon={MessageSquareHeart} title="本周备注" description="可以写下一个彼此都舒服的提醒。">
            <Textarea
              value={partner.note}
              onChange={(event) =>
                setPartner((current) => ({
                  ...current,
                  note: event.target.value
                }))
              }
              placeholder="例如：这周找一个下班后不太赶的晚上。"
            />
          </SectionCard>
        </div>

        <SectionCard icon={CheckCircle2} title="共享周目标" description="选一个就好。目标会保留，完成状态每周一重新开始。">
          <div className="space-y-4">
            <OptionGroup
              options={goalOptions}
              value={partner.weeklyGoal}
              onChange={(weeklyGoal) =>
                setPartner((current) => ({
                  ...current,
                  weeklyGoal,
                  completedThisWeek: false,
                  updatedAt: new Date().toISOString()
                }))
              }
            />

            <button
              aria-pressed={completedThisWeek}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border px-3 py-4 text-left transition",
                completedThisWeek
                  ? "border-[hsl(var(--app-primary))] bg-[hsl(var(--app-soft))] text-[hsl(var(--app-primary))]"
                  : "border-[hsl(var(--app-border))] bg-[hsl(var(--app-card))] text-[hsl(var(--app-ink))]"
              )}
              onClick={() =>
                setPartner((current) => {
                  const now = new Date();
                  return {
                    ...current,
                    completedThisWeek: !(current.completedThisWeek && isSameWeek(current.updatedAt, now)),
                    updatedAt: now.toISOString()
                  };
                })
              }
              type="button"
            >
              <span>
                <span className="block text-sm font-semibold">这周已经一起完成</span>
                <span className="mt-1 block text-xs leading-5 text-[hsl(var(--app-muted))]">
                  只是温柔记录，不需要证明什么。
                </span>
              </span>
              <CheckCircle2 className={cn("h-5 w-5", completedThisWeek ? "opacity-100" : "opacity-30")} />
            </button>

            <Button
              className="w-full"
              variant="secondary"
              onClick={() =>
                setPartner((current) => ({
                  ...current,
                  weeklyGoal: null,
                  completedThisWeek: false,
                  updatedAt: new Date().toISOString()
                }))
              }
            >
              清空本周目标
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
