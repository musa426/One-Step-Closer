import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
  className?: string;
};

export function StatCard({ icon: Icon, label, value, note, className }: StatCardProps) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[hsl(var(--app-muted))]">{label}</p>
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-[hsl(var(--app-soft))] text-[hsl(var(--app-primary))]">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
      <p className="text-3xl font-semibold tracking-normal text-[hsl(var(--app-ink))]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[hsl(var(--app-muted))]">{note}</p>
    </Card>
  );
}
