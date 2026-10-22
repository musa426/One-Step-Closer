"use client";

import { Bell, Palette, SlidersHorizontal, Type } from "lucide-react";
import { OptionGroup } from "@/components/option-group";
import { SectionCard } from "@/components/section-card";
import { useAppData } from "@/components/app-provider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  focusLabels,
  themeLabels,
  type MainFocus,
  type ThemeName
} from "@/lib/types";

const focusOptions = [
  { value: "food", label: focusLabels.food, helper: "把选择吃得更安心放在前面" },
  { value: "salah", label: focusLabels.salah, helper: "让礼拜成为主要提醒" },
  { value: "quran", label: focusLabels.quran, helper: "多一点理解与聆听" },
  { value: "balanced", label: focusLabels.balanced, helper: "饮食、礼拜与 Qur'an 一起轻轻看见" }
] satisfies { value: MainFocus; label: string; helper: string }[];

const themeOptions = [
  { value: "warm", label: themeLabels.warm, helper: "奶油色、绿意与金色点缀" },
  { value: "green", label: themeLabels.green, helper: "更清新的绿色背景" },
  { value: "minimal", label: themeLabels.minimal, helper: "更克制、更安静" }
] satisfies { value: ThemeName; label: string; helper: string }[];

export default function SettingsPage() {
  const { settings, setSettings } = useAppData();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionCard icon={Type} title="应用名称" description="可以换成一个更私人、更柔和的名字。">
        <Input
          value={settings.appName}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              appName: event.target.value
            }))
          }
          placeholder="One Step Closer"
        />
      </SectionCard>

      <SectionCard icon={Bell} title="每日提醒文字" description="这句话会出现在今日页面。">
        <Textarea
          value={settings.reminderText}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              reminderText: event.target.value
            }))
          }
          placeholder="今天只需要靠近一点点。"
        />
      </SectionCard>

      <SectionCard icon={SlidersHorizontal} title="主要关注" description="调整顶部显示的关注方向。">
        <OptionGroup
          options={focusOptions}
          value={settings.mainFocus}
          onChange={(mainFocus) =>
            setSettings((current) => ({
              ...current,
              mainFocus
            }))
          }
        />
      </SectionCard>

      <SectionCard icon={Palette} title="主题" description="选择一个更适合你当下状态的视觉气质。">
        <OptionGroup
          columns="one"
          options={themeOptions}
          value={settings.theme}
          onChange={(theme) =>
            setSettings((current) => ({
              ...current,
              theme
            }))
          }
        />
      </SectionCard>
    </div>
  );
}
