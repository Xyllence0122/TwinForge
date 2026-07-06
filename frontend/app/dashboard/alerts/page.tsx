"use client";

import { useState } from "react";
import { BellOff, CheckCheck, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSimulation } from "@/lib/simulation/store";
import { useMounted } from "@/hooks/useMounted";
import { cn } from "@/lib/utils";
import { ALERT_COLORS } from "@/lib/constants";
import { AlertRow } from "@/components/alerts/AlertRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { AlertLevel } from "@/lib/types";

const LEVELS: AlertLevel[] = ["critical", "warning", "info"];

/** Alert Center — severity-graded notification history with workflow. */
export default function AlertsPage() {
  const { dict, t } = useI18n();
  const mounted = useMounted();
  const alerts = useSimulation((s) => s.alerts);
  const machines = useSimulation((s) => s.machines);
  const acknowledgeAll = useSimulation((s) => s.acknowledgeAll);
  const clearAlerts = useSimulation((s) => s.clearAlerts);
  const [levelFilter, setLevelFilter] = useState<AlertLevel | "all">("all");
  const [machineFilter, setMachineFilter] = useState<string>("all");

  if (!mounted) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const levelLabel = (l: AlertLevel) =>
    l === "critical" ? dict.alerts.levelCritical : l === "warning" ? dict.alerts.levelWarning : dict.alerts.levelInfo;

  const filtered = alerts
    .filter((a) => levelFilter === "all" || a.level === levelFilter)
    .filter((a) => machineFilter === "all" || a.machineId === machineFilter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">{dict.alerts.title}</h1>
          <p className="mt-0.5 text-xs text-ink-faint">{dict.alerts.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={acknowledgeAll} disabled={alerts.length === 0}>
            <CheckCheck className="h-3.5 w-3.5" /> {dict.alerts.ackAll}
          </Button>
          <Button variant="ghost" size="sm" onClick={clearAlerts} disabled={alerts.length === 0}>
            <Trash2 className="h-3.5 w-3.5" /> {dict.alerts.clearAll}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-[11px] uppercase tracking-wider text-ink-faint">
            {dict.alerts.filterLevel}
          </span>
          <button
            onClick={() => setLevelFilter("all")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
              levelFilter === "all"
                ? "border-primary/50 bg-primary/15 text-ink"
                : "border-line text-ink-faint hover:text-ink",
            )}
          >
            {dict.common.all}
          </button>
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevelFilter(levelFilter === l ? "all" : l)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                levelFilter === l
                  ? "border-primary/50 bg-primary/15 text-ink"
                  : "border-line text-ink-faint hover:text-ink",
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ALERT_COLORS[l] }} />
              {levelLabel(l)}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-ink-faint">
            {dict.alerts.filterMachine}
          </span>
          <select
            value={machineFilter}
            onChange={(e) => setMachineFilter(e.target.value)}
            className="h-9 rounded-xl border border-line bg-surface px-2.5 text-xs text-ink outline-none focus:border-primary/40"
          >
            <option value="all">{dict.common.all}</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-[11px] text-ink-faint">
        {t("alerts.showingCount", { shown: filtered.length, total: alerts.length })}
      </div>

      {/* Alert list / empty state */}
      {filtered.length === 0 ? (
        <EmptyState icon={BellOff} title={dict.alerts.emptyTitle} body={dict.alerts.emptyBody} />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {filtered.map((a) => (
            <AlertRow key={a.id} alert={a} />
          ))}
        </div>
      )}
    </div>
  );
}
