"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Clock, Factory, Timer, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSimulation } from "@/lib/simulation/store";
import { useMounted } from "@/hooks/useMounted";
import {
  computeKpis,
  downtimeByCause,
  energyByHour,
  productionByDay,
} from "@/lib/simulation/analytics";
import { lstmAutoencoderMock, getRecommendations } from "@/lib/simulation/ai";
import { fmt } from "@/lib/utils";
import { GlassCard, CardHeader } from "@/components/ui/GlassCard";
import { RadialGauge } from "@/components/ui/RadialGauge";
import { Stat } from "@/components/ui/Stat";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { ALERT_COLORS } from "@/lib/constants";

const TOOLTIP_STYLE = {
  background: "rgba(11,17,32,0.92)",
  border: "1px solid rgba(148,163,184,0.18)",
  borderRadius: 12,
  fontSize: 12,
  color: "#E2E8F0",
} as const;

const AXIS_TICK = { fill: "#64748B", fontSize: 10 } as const;

/** Analytics — OEE breakdown, reliability, energy, production, AI layer. */
export default function AnalyticsPage() {
  const { dict } = useI18n();
  const mounted = useMounted();
  const machines = useSimulation((s) => s.machines);
  const energyKwh = useSimulation((s) => s.energyKwh);

  if (!mounted) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = computeKpis(machines, energyKwh);
  const energy = energyByHour();
  const production = productionByDay();
  const downtime = downtimeByCause();
  const anomalies = machines
    .map((m) => ({ machine: m, result: lstmAutoencoderMock.detect(m) }))
    .sort((a, b) => b.result.score - a.result.score);
  const recs = getRecommendations(machines);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">{dict.analytics.title}</h1>
        <p className="mt-0.5 text-xs text-ink-faint">{dict.analytics.subtitle}</p>
      </div>

      {/* OEE breakdown */}
      <GlassCard>
        <CardHeader title={dict.analytics.oeeLong} subtitle="OEE = A × P × Q" />
        <div className="flex flex-wrap items-center justify-around gap-6 px-5 pb-6">
          <RadialGauge value={kpis.oee * 100} label={dict.analytics.oee} color="#3B82F6" size={150} />
          <RadialGauge value={kpis.availability * 100} label={dict.analytics.availability} color="#22D3EE" />
          <RadialGauge value={kpis.performance * 100} label={dict.analytics.performance} color="#A78BFA" />
          <RadialGauge value={kpis.quality * 100} label={dict.analytics.quality} color="#10B981" />
        </div>
      </GlassCard>

      {/* Reliability + energy + downtime stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat
          label={`${dict.analytics.mtbf} · ${dict.analytics.mtbfLong}`}
          value={fmt(kpis.mtbfHours, 0)}
          unit="h"
          icon={Timer}
          accent="#10B981"
        />
        <Stat
          label={`${dict.analytics.mttr} · ${dict.analytics.mttrLong}`}
          value={fmt(kpis.mttrHours, 1)}
          unit="h"
          icon={Clock}
          accent="#F59E0B"
        />
        <Stat
          label={dict.analytics.energy}
          value={fmt(kpis.energyKwhToday, 0)}
          unit="kWh"
          icon={Zap}
          accent="#22D3EE"
        />
        <Stat
          label={dict.analytics.unitsToday}
          value={fmt(kpis.dailyProduction, 0)}
          hint={`${dict.analytics.target}: ${fmt(kpis.productionTarget, 0)}`}
          icon={Factory}
          accent="#3B82F6"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Energy by hour */}
        <GlassCard>
          <CardHeader title={dict.analytics.energy} subtitle={dict.analytics.energySub} />
          <div className="px-3 pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={energy} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="hour" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} minTickGap={28} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(148,163,184,0.06)" }} formatter={(v) => [`${fmt(Number(v))} kWh`, ""]} />
                <Bar dataKey="kwh" fill="#22D3EE" radius={[4, 4, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Production vs target */}
        <GlassCard>
          <CardHeader title={dict.analytics.production} subtitle={dict.analytics.productionSub} />
          <div className="px-3 pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={production} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="day" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(148,163,184,0.06)" }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#94A3B8" }} />
                <Bar name={dict.analytics.actual} dataKey="actual" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Bar name={dict.analytics.target} dataKey="target" fill="rgba(148,163,184,0.35)" radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Downtime pareto */}
        <GlassCard>
          <CardHeader
            title={dict.analytics.downtime}
            subtitle={dict.analytics.downtimeSub}
            action={
              <span className="tabular text-xs text-ink-dim">
                {fmt(kpis.downtimeHoursToday, 1)} h
              </span>
            }
          />
          <div className="space-y-3 px-5 pb-5 pt-2">
            {downtime.map((d) => {
              const max = downtime[0].hours;
              return (
                <div key={d.cause}>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="text-ink-dim">{dict.analytics.downtimeCauses[d.cause]}</span>
                    <span className="tabular font-semibold text-ink">{fmt(d.hours, 1)} h</span>
                  </div>
                  <ProgressBar value={(d.hours / max) * 100} color="#F59E0B" />
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* AI predictive layer */}
      <div>
        <div className="mb-3 flex items-center gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">{dict.analytics.aiSectionTitle}</h2>
            <p className="text-[11px] text-ink-faint">{dict.analytics.aiSectionSub}</p>
          </div>
          <Badge color="#A78BFA" dot={false}>{dict.ai.modelBadge}</Badge>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {/* Fleet anomaly board */}
          <GlassCard>
            <CardHeader title={dict.ai.anomalyTitle} subtitle={dict.ai.anomalySub} />
            <div className="space-y-3 px-5 pb-5">
              {anomalies.map(({ machine, result }) => (
                <div key={machine.id}>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="text-ink-dim">{machine.name}</span>
                    <span
                      className="tabular font-semibold"
                      style={{ color: result.isAnomaly ? "#EF4444" : "#94A3B8" }}
                    >
                      {fmt(result.score, 2)}
                    </span>
                  </div>
                  <ProgressBar
                    value={result.score * 100}
                    color={result.isAnomaly ? "#EF4444" : "#3B82F6"}
                  />
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Fleet recommendations */}
          <GlassCard>
            <CardHeader title={dict.ai.recsTitle} subtitle={dict.ai.recsSub} />
            <div className="space-y-2 px-5 pb-5">
              {recs.length === 0 ? (
                <p className="rounded-xl border border-line bg-white/[0.02] px-3 py-4 text-center text-xs text-ink-faint">
                  {dict.ai.noRecs}
                </p>
              ) : (
                recs.slice(0, 6).map((rec) => {
                  const machine = machines.find((m) => m.id === rec.machineId);
                  return (
                    <div key={rec.id} className="flex items-start gap-2.5 rounded-xl border border-line bg-white/[0.02] px-3 py-2.5">
                      <span
                        className="dot-glow mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: ALERT_COLORS[rec.severity], color: ALERT_COLORS[rec.severity] }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[10px] text-ink-faint">
                          <span className="truncate font-medium text-ink-dim">{machine?.name}</span>
                          <span className="tabular shrink-0">
                            {fmt(rec.confidence * 100, 0)}% {dict.ai.confidence}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-ink-dim">{dict.aiRecs[rec.code]}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
