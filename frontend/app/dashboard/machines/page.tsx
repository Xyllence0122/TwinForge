"use client";

import { useState } from "react";
import { Boxes, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSimulation } from "@/lib/simulation/store";
import { useMounted } from "@/hooks/useMounted";
import { cn } from "@/lib/utils";
import { MachineCard } from "@/components/machines/MachineCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { STATUS_COLORS } from "@/lib/constants";
import type { MachineStatus } from "@/lib/types";

type SortKey = "health" | "name" | "status";

const STATUS_ORDER: MachineStatus[] = ["running", "idle", "maintenance", "offline"];

/** Machines — filterable, sortable fleet registry. */
export default function MachinesPage() {
  const { dict } = useI18n();
  const mounted = useMounted();
  const machines = useSimulation((s) => s.machines);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MachineStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("health");

  if (!mounted) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = machines
    .filter((m) => statusFilter === "all" || m.status === statusFilter)
    .filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.zone.toLowerCase().includes(q) ||
        dict.machineTypes[m.type].toLowerCase().includes(q),
    )
    .sort((a, b) => {
      if (sort === "health") return a.health.healthScore - b.health.healthScore;
      if (sort === "name") return a.name.localeCompare(b.name);
      return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">{dict.machines.title}</h1>
        <p className="mt-0.5 text-xs text-ink-faint">{dict.machines.subtitle}</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-9 w-64 items-center gap-2 rounded-xl border border-line bg-white/[0.03] px-3 focus-within:border-primary/40">
          <Search className="h-4 w-4 shrink-0 text-ink-faint" strokeWidth={1.5} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.machines.searchPlaceholder}
            className="w-full bg-transparent text-xs text-ink outline-none placeholder:text-ink-faint"
          />
        </div>

        {/* Status filter chips */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStatusFilter("all")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
              statusFilter === "all"
                ? "border-primary/50 bg-primary/15 text-ink"
                : "border-line text-ink-faint hover:text-ink",
            )}
          >
            {dict.common.all}
          </button>
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                statusFilter === s
                  ? "border-primary/50 bg-primary/15 text-ink"
                  : "border-line text-ink-faint hover:text-ink",
              )}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[s] }}
              />
              {dict.status[s]}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-ink-faint">{dict.machines.sortBy}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-9 rounded-xl border border-line bg-surface px-2.5 text-xs text-ink outline-none focus:border-primary/40"
          >
            <option value="health">{dict.machines.sortHealth}</option>
            <option value="name">{dict.machines.sortName}</option>
            <option value="status">{dict.machines.sortStatus}</option>
          </select>
        </div>
      </div>

      {/* Grid / empty state */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title={dict.machines.emptyTitle}
          body={dict.machines.emptyBody}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
              }}
            >
              {dict.machines.clearFilters}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filtered.map((m, i) => (
            <MachineCard key={m.id} machine={m} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
