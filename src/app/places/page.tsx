"use client";

import { Heart, MapPin, Plus, Store, Trash2 } from "lucide-react";
import { useState } from "react";
import { SectionCard } from "@/components/section-card";
import { useAppData } from "@/components/app-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { placeTypeLabels, type PlaceType, type SavedPlace } from "@/lib/types";
import { cn } from "@/lib/utils";

const initialForm = {
  name: "",
  type: "restaurant" as PlaceType,
  location: "",
  notes: "",
  favorite: false
};

export default function HalalPlacesPage() {
  const { places, setPlaces } = useAppData();
  const [form, setForm] = useState(initialForm);
  const sortedPlaces = [...places].sort((a, b) => Number(b.favorite) - Number(a.favorite));
  const canSave = form.name.trim().length > 0;

  function addPlace() {
    if (!canSave) {
      return;
    }

    const nextPlace: SavedPlace = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      type: form.type,
      location: form.location.trim(),
      notes: form.notes.trim(),
      favorite: form.favorite,
      createdAt: new Date().toISOString()
    };

    if (setPlaces((current) => [nextPlace, ...current])) {
      setForm(initialForm);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <SectionCard icon={Plus} title="保存一个清真友好地点" description="餐厅、超市、素食选择，都可以先放在这里。">
        <div className="space-y-3">
          <Input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="名称"
          />
          <Select
            value={form.type}
            onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as PlaceType }))}
            aria-label="地点类型"
          >
            {Object.entries(placeTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            value={form.location}
            onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
            placeholder="位置"
          />
          <Textarea
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="备注，例如招牌菜、停车、是否适合一起去"
          />
          <button
            className={cn(
              "flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left transition",
              form.favorite
                ? "border-[hsl(var(--app-primary))] bg-[hsl(var(--app-soft))] text-[hsl(var(--app-primary))]"
                : "border-[hsl(var(--app-border))] bg-[hsl(var(--app-card))] text-[hsl(var(--app-ink))]"
            )}
            onClick={() => setForm((current) => ({ ...current, favorite: !current.favorite }))}
            type="button"
          >
            <span className="text-sm font-medium">标记为常去 / 想去</span>
            <Heart className={cn("h-5 w-5", form.favorite && "fill-current")} aria-hidden="true" />
          </button>
          <Button className="w-full" disabled={!canSave} onClick={addPlace}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            保存地点
          </Button>
        </div>
      </SectionCard>

      <div className="space-y-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[hsl(var(--app-soft))] text-[hsl(var(--app-primary))]">
              <Store className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[hsl(var(--app-ink))]">我的地点</h2>
              <p className="text-sm text-[hsl(var(--app-muted))]">{places.length} 个保存的选择</p>
            </div>
          </div>
        </Card>

        {sortedPlaces.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-lg bg-[hsl(var(--app-soft))] text-[hsl(var(--app-primary))]">
              <MapPin className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-[hsl(var(--app-ink))]">还没有保存地点</h3>
            <p className="mt-2 text-sm leading-6 text-[hsl(var(--app-muted))]">
              先保存一个可靠的选择。以后需要做决定时，它会让事情轻一点。
            </p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {sortedPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceCard({ place }: { place: SavedPlace }) {
  const { setPlaces } = useAppData();

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-[hsl(var(--app-ink))]">{place.name}</h3>
            <span className="rounded-lg bg-[hsl(var(--app-soft))] px-2 py-1 text-xs font-medium text-[hsl(var(--app-primary))]">
              {placeTypeLabels[place.type]}
            </span>
            {place.favorite ? <Heart className="h-4 w-4 fill-current text-[hsl(var(--app-accent))]" aria-label="常去或想去" /> : null}
          </div>
          {place.location ? <p className="mt-2 text-sm text-[hsl(var(--app-muted))]">{place.location}</p> : null}
          {place.notes ? <p className="mt-3 text-sm leading-6 text-[hsl(var(--app-ink))]">{place.notes}</p> : null}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            aria-label={place.favorite ? "取消常去或想去" : "标记为常去或想去"}
            size="icon"
            variant="ghost"
            onClick={() =>
              setPlaces((current) =>
                current.map((item) => (item.id === place.id ? { ...item, favorite: !item.favorite } : item))
              )
            }
          >
            <Heart className={cn("h-4 w-4", place.favorite && "fill-current text-[hsl(var(--app-accent))]")} />
          </Button>
          <Button
            aria-label="移除地点"
            size="icon"
            variant="ghost"
            onClick={() => setPlaces((current) => current.filter((item) => item.id !== place.id))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
