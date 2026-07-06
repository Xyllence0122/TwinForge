"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Cpu, SearchX, Wrench, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSimulation } from "@/lib/simulation/store";
import { useMounted } from "@/hooks/useMounted";
import { SENSOR_COLORS, SENSOR_UNITS } from "@/lib/constants";
import { fmt, fmtHours } from "@/lib/utils";
import { GlassCard, CardHeader } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { RadialGauge } from "@/components/ui/RadialGauge";
import { healthColor } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { RealtimeChart } from "@/components/charts/RealtimeChart";
import { AiInsights } from "@/components/machines/AiInsights";
import type { SensorKey } from "@/lib/types";

const ALL_SENSORS: SensorKey[] = [
  "temperature",
  "current",
  "power",
  "rpm",
  "pressure",
  "humidity",
  "vibration",
];

const TREND_CHARTS: Array<{ key: "temperature" | "current" | "vibration" | "power" }> = [
  { key: "temperature" },
  { key: "current" },
  { key: "vibration" },
  { key: "power" },
];

/** Machine Detail — full telemetry, health, trends and AI insights. */
export default function MachineDetailPage() {
  const params = useParams<{ id: string }>();
  const { dict } = useI18n();
  const mounted = useMounted();
  const machine = useSimulation((s) => s.machines.find((m) => m.id === params.id));
  const history = useSimulation((s) => s.history[params.id] ?? []);
  const injectFault = useSimulation((s) => s.injectFault);
  const clearFault = useSimulation((s) => s.clearFault);

  if (!mounted) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (!machine) {
    return (
      <EmptyState
        icon={SearchX}
        title={dict.machineDetail.notFoundTitle}
        body={dict.machineDetail.notFoundBody}
        action={
          <Link href="/dashboard/machines">
            <Button variant="primary" size="sm">
              {dict.machineDetail.backToMachines}
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb + header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-ink-faint">
            <Link href="/dashboard/machines" className="transition-colors hover:text-ink">
              {dict.machineDetail.backToMachines}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-ink-dim">{machine.name}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-3">
            <h1 className="text-xl font-semibold text-ink">{machine.name}</h1>
            <StatusBadge status={machine.status} label={dict.status[machine.status]} />
            {machine.activeFault && (
              <span className="rounded-full border border-critical/40 bg-critical/10 px-2.5 py-0.5 text-[11px] font-medium text-[#FCA5A5]">
                {dict.machineDetail.activeFault}: {dict.faults[machine.activeFault]}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {machine.activeFault ? (
            <Button variant="success" size="sm" onClick={() => clearFault(machine.id)}>
              <Wrench className="h-3.5 w-3.5" /> {dict.machineDetail.clearFault}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => injectFault(machine.id)}
              disabled={machine.status === "offline"}
            >
              <Zap className="h-3.5 w-3.5 text-warning" /> {dict.machineDetail.injectFault}
            </Button>
          )}
          <Link href="/dashboard/twin" onClick={() => useSimulation.getState().selectMachine(machine.id)}>
            <Button variant="primary" size="sm">
              <Cpu className="h-3.5 w-3.5" /> {dict.machineDetail.openInTwin}
            </Button>
          </Link>
        </div>
      </div>

      {/* Health gauges + asset info */}
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <CardHeader title={dict.machineDetail.healthTitle} subtitle={dict.machineDetail.healthSub} />
          <div className="flex flex-wrap items-center justify-around gap-4 px-5 pb-6">
            <RadialGauge
              value={machine.health.healthScore}
              label={dict.sensors.healthScore}
              color={healthColor(machine.health.healthScore)}
            />
            <RadialGauge
              value={machine.health.faultProbability * 100}
              label={dict.sensors.faultProbability}
              color={machine.health.faultProbability > 0.4 ? "#EF4444" : "#3B82F6"}
            />
            <RadialGauge
              value={(machine.health.rulHours / 2400) * 100}
              display={fmt(machine.health.rulHours, 0)}
              label={`${dict.sensors.rul} (h)`}
              color="#22D3EE"
            />
          </div>
        </GlassCard>

        <GlassCard>
          <CardHeader title={dict.machineDetail.specs} />
          <div className="space-y-2.5 px-5 pb-5 text-xs">
            {[
              [dict.machineDetail.specType, dict.machineTypes[machine.type]],
              [dict.machineDetail.specZone, machine.zone],
              [dict.machineDetail.specUptime, fmtHours(machine.uptimeHours)],
              [dict.machineDetail.specStatus, dict.status[machine.status]],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-line pb-2.5 last:border-0">
                <span className="text-ink-faint">{label}</span>
                <span className="font-medium text-ink">{value}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Live sensor grid */}
      <GlassCard>
        <CardHeader title={dict.machineDetail.liveTelemetry} subtitle={dict.machineDetail.liveTelemetrySub} />
        <div className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-4 xl:grid-cols-7">
          {ALL_SENSORS.map((key) => (
            <div key={key} className="rounded-xl border border-line bg-white/[0.02] p-3">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: SENSOR_COLORS[key] }} />
                <span className="text-[10px] uppercase tracking-wider text-ink-faint">
                  {dict.sensors[key]}
                </span>
              </div>
              <div className="tabular mt-2 text-lg font-semibold text-ink">
                {fmt(machine.sensors[key], key === "rpm" ? 0 : 1)}
              </div>
              <div className="text-[10px] text-ink-faint">{SENSOR_UNITS[key]}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Trend charts */}
      <div>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-ink">{dict.machineDetail.trendTitle}</h2>
          <p className="text-[11px] text-ink-faint">{dict.machineDetail.trendSub}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {TREND_CHARTS.map(({ key }) => (
            <GlassCard key={key}>
              <CardHeader title={dict.sensors[key]} subtitle={SENSOR_UNITS[key]} />
              <div className="px-3 pb-4">
                <RealtimeChart
                  data={history}
                  dataKey={key}
                  color={SENSOR_COLORS[key]}
                  unit={SENSOR_UNITS[key]}
                  height={170}
                />
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* AI insights */}
      <div>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-ink">{dict.machineDetail.aiTitle}</h2>
          <p className="text-[11px] text-ink-faint">{dict.machineDetail.aiSub}</p>
        </div>
        <AiInsights machine={machine} />
      </div>
    </div>
  );
}
